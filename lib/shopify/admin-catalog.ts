import "server-only";

import type { Collection, Image, Product, ProductVariant } from "@/types/shopify";
import { adminGraphqlFetch } from "./admin-graphql";

function stripHtml(html: string | null | undefined): string {
  const s = html ?? "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

type Money = { amount: string; currencyCode: string };

type AdminProductNode = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string | null;
  status: string;
  priceRangeV2: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  } | null;
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  images: {
    edges: {
      node: {
        url: string;
        altText: string | null;
        width: number | null;
        height: number | null;
      };
    }[];
  };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: string;
        selectedOptions: { name: string; value: string }[];
      };
    }[];
  };
  seo: { title: string | null; description: string | null } | null;
};

const PRODUCT_FRAGMENT = `
  fragment ProductForCatalog on Product {
    id
    handle
    title
    descriptionHtml
    status
    priceRangeV2 {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 20) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 250) {
      edges {
        node {
          id
          title
          availableForSale
          price
          selectedOptions {
            name
            value
          }
        }
      }
    }
    seo {
      title
      description
    }
  }
`;

function mapImage(n: {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}): Image {
  return {
    url: n.url,
    altText: n.altText ?? "",
    width: n.width ?? 0,
    height: n.height ?? 0,
  };
}

function mapAdminProduct(node: AdminProductNode): Product {
  const bodyHtml = node.descriptionHtml ?? "";
  const plain = stripHtml(bodyHtml);

  const seen = new Set<string>();
  const imageNodes: Image[] = [];
  if (node.featuredImage?.url) {
    imageNodes.push(mapImage(node.featuredImage));
    seen.add(node.featuredImage.url);
  }
  for (const e of node.images?.edges ?? []) {
    const u = e.node.url;
    if (u && !seen.has(u)) {
      seen.add(u);
      imageNodes.push(mapImage(e.node));
    }
  }

  const currency =
    node.priceRangeV2?.minVariantPrice?.currencyCode ||
    node.priceRangeV2?.maxVariantPrice?.currencyCode ||
    "USD";

  const minA = String(node.priceRangeV2?.minVariantPrice?.amount ?? "0");
  const maxA = String(
    node.priceRangeV2?.maxVariantPrice?.amount ?? minA,
  );

  const variants: { node: ProductVariant }[] = node.variants.edges.map(
    (edge) => ({
      node: {
        id: edge.node.id,
        title: edge.node.title,
        availableForSale: edge.node.availableForSale,
        price: {
          amount: String(edge.node.price),
          currencyCode: currency,
        },
        selectedOptions: edge.node.selectedOptions ?? [],
      },
    }),
  );

  const anyVariantAvailable = variants.some((v) => v.node.availableForSale);
  const availableForSale =
    node.status === "ACTIVE" && anyVariantAvailable;

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: plain || node.title,
    descriptionHtml: bodyHtml,
    availableForSale,
    priceRange: {
      minVariantPrice: { amount: minA, currencyCode: currency },
      maxVariantPrice: { amount: maxA, currencyCode: currency },
    },
    variants: { edges: variants },
    images: {
      edges: imageNodes.map((img) => ({ node: img })),
    },
    seo: {
      title: node.seo?.title || node.title,
      description: (node.seo?.description || plain).slice(0, 320),
    },
  };
}

export async function adminGetCollections(): Promise<Collection[]> {
  const query = `
    query CollectionsForCatalog {
      collections(first: 100, sortKey: TITLE) {
        edges {
          node {
            id
            title
            handle
            descriptionHtml
            seo {
              title
              description
            }
          }
        }
      }
    }
  `;

  const res = await adminGraphqlFetch<{
    data: {
      collections: {
        edges: {
          node: {
            id: string;
            handle: string;
            title: string;
            descriptionHtml: string | null;
            seo: { title: string | null; description: string | null } | null;
          };
        }[];
      };
    };
  }>({ query, tags: ["collections"] });

  return res.body.data.collections.edges.map(({ node }) => {
    const plain = stripHtml(node.descriptionHtml);
    return {
      id: node.id,
      handle: node.handle,
      title: node.title,
      description: plain,
      seo: {
        title: node.seo?.title || node.title,
        description: (node.seo?.description || plain).slice(0, 320),
      },
      products: { edges: [] },
    };
  });
}

/**
 * Chỉ lấy sản phẩm đang bán (active + published). Kết hợp thêm bộ lọc tìm kiếm nếu có.
 * @see https://shopify.dev/docs/api/usage/search-syntax
 */
const CATALOG_PRODUCT_SEARCH_BASE =
  "status:ACTIVE AND published_status:published";

function combineCatalogProductSearch(userQuery?: string | null): string {
  const q = userQuery?.trim();
  if (!q) return CATALOG_PRODUCT_SEARCH_BASE;
  return `(${CATALOG_PRODUCT_SEARCH_BASE}) AND (${q})`;
}

function mapProductSortKey(
  sk: string | undefined,
  collection: boolean,
): string {
  if (collection) {
    const m: Record<string, string> = {
      COLLECTION_DEFAULT: "COLLECTION_DEFAULT",
      BEST_SELLING: "BEST_SELLING",
      TITLE: "TITLE",
      PRICE: "PRICE",
      CREATED: "CREATED",
      MANUAL: "MANUAL",
      RELEVANCE: "RELEVANCE",
      ID: "ID",
    };
    return m[sk || "COLLECTION_DEFAULT"] || "COLLECTION_DEFAULT";
  }
  const m: Record<string, string> = {
    CREATED_AT: "CREATED_AT",
    ID: "ID",
    INVENTORY_TOTAL: "INVENTORY_TOTAL",
    PRODUCT_TYPE: "PRODUCT_TYPE",
    PUBLISHED_AT: "PUBLISHED_AT",
    RELEVANCE: "RELEVANCE",
    TITLE: "TITLE",
    UPDATED_AT: "UPDATED_AT",
    VENDOR: "VENDOR",
    // legacy / Storefront-style names → closest Admin enum
    BEST_SELLING: "PUBLISHED_AT",
    PRICE: "TITLE",
    CREATED: "CREATED_AT",
  };
  return m[sk || "PUBLISHED_AT"] || "PUBLISHED_AT";
}

export async function adminGetProducts(opts: {
  collectionHandle?: string;
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  if (opts.collectionHandle) {
    const gql = `
      ${PRODUCT_FRAGMENT}
      query CollectionProducts(
        $handle: String!
        $first: Int!
        $sortKey: ProductCollectionSortKeys
        $reverse: Boolean
      ) {
        collectionByHandle(handle: $handle) {
          products(
            first: $first
            sortKey: $sortKey
            reverse: $reverse
          ) {
            edges {
              node {
                ...ProductForCatalog
              }
            }
          }
        }
      }
    `;

    const res = await adminGraphqlFetch<{
      data: {
        collectionByHandle: {
          products: {
            edges: { node: AdminProductNode }[];
          } | null;
        } | null;
      };
    }>({
      query: gql,
      tags: ["products"],
      variables: {
        handle: opts.collectionHandle,
        first: 100,
        sortKey: mapProductSortKey(opts.sortKey, true),
        reverse: opts.reverse ?? false,
      },
    });

    const edges =
      res.body.data.collectionByHandle?.products?.edges ?? [];
    return edges.map((e) => mapAdminProduct(e.node));
  }

  const gql = `
    ${PRODUCT_FRAGMENT}
    query ProductsForCatalog(
      $first: Int!
      $query: String
      $sortKey: ProductSortKeys
      $reverse: Boolean
    ) {
      products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            ...ProductForCatalog
          }
        }
      }
    }
  `;

  const res = await adminGraphqlFetch<{
    data: {
      products: { edges: { node: AdminProductNode }[] };
    };
  }>({
    query: gql,
    tags: ["products"],
    variables: {
      first: 100,
      query: combineCatalogProductSearch(opts.query),
      sortKey: mapProductSortKey(opts.sortKey, false),
      reverse: opts.reverse ?? false,
    },
  });

  return res.body.data.products.edges.map((e) => mapAdminProduct(e.node));
}

export async function adminGetProductByHandle(
  handle: string,
): Promise<Product | undefined> {
  const gql = `
    ${PRODUCT_FRAGMENT}
    query ProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        ...ProductForCatalog
      }
    }
  `;

  const res = await adminGraphqlFetch<{
    data: { productByHandle: AdminProductNode | null };
  }>({
    query: gql,
    tags: ["products"],
    variables: { handle },
  });

  const p = res.body.data.productByHandle;
  if (!p) return undefined;
  return mapAdminProduct(p);
}
