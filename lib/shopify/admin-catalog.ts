import "server-only";

import type { Collection, Image, Product, ProductVariant } from "@/types/shopify";
import { adminGraphqlFetch } from "./admin-graphql";
import { shopifyFetch } from "./index";
import { SHOW_REVIEWS } from "@/lib/reviews";

function stripHtml(html: string | null | undefined): string {
  const s = html ?? "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Extract a short tagline from the first <p> of the description. Returns the
// first sentence (up to . ! ?). Skips the leading <h2> title so we don't echo
// the product title. Null when descriptionHtml has no <p>.
function extractTagline(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) return null;
  const text = stripHtml(match[1]);
  if (!text) return null;
  const sentence = text.match(/^[^.!?]+[.!?]/)?.[0] ?? text;
  return sentence.trim() || null;
}

type Money = { amount: string; currencyCode: string };

type AdminProductNode = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string | null;
  status: string;
  tags: string[] | null;
  priceRangeV2: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  } | null;
  // NOTE: Shopify's ProductCompareAtPriceRange uses *CompareAtPrice* suffixes,
  // not the *Price suffixes that priceRangeV2 uses. We normalize to the same
  // shape (minVariantPrice / maxVariantPrice) on the Product type so callers
  // don't have to learn the distinction.
  compareAtPriceRange: {
    minVariantCompareAtPrice: Money;
    maxVariantCompareAtPrice: Money;
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
        image: { url: string; altText: string | null } | null;
      };
    }[];
  };
  // Targeted fetch: only the metafields cards need (ratings + tagline).
  // Avoids pulling all metafields (the full PDP query in admin-product-page.ts
  // handles that for the product page itself).
  reviewsMetafield: { value: string | null } | null;
  taglineMetafield: { value: string | null } | null;
  seo: { title: string | null; description: string | null } | null;
};

const PRODUCT_FRAGMENT = `
  fragment ProductForCatalog on Product {
    id
    handle
    title
    descriptionHtml
    status
    tags
    priceRangeV2 {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantCompareAtPrice { amount currencyCode }
      maxVariantCompareAtPrice { amount currencyCode }
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
          image {
            url
            altText
          }
        }
      }
    }
    reviewsMetafield: metafield(namespace: "beepaws", key: "reviews") {
      value
    }
    taglineMetafield: metafield(namespace: "beepaws", key: "tagline") {
      value
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
        image: edge.node.image
          ? { url: edge.node.image.url, altText: edge.node.image.altText ?? "" }
          : null,
      },
    }),
  );

  const anyVariantAvailable = variants.some((v) => v.node.availableForSale);
  const availableForSale =
    node.status === "ACTIVE" && anyVariantAvailable;

  // Derive aggregate rating from beepaws.reviews. We do this server-side once
  // per catalog fetch rather than store a separate metafield, so the content
  // editor never has to keep two fields in sync.
  // Gated by SHOW_REVIEWS: while reviews are off, no rating exists anywhere
  // downstream (hero, product cards) — see lib/reviews.ts.
  let rating: { avg: number; count: number } | null = null;
  const reviewsRaw = node.reviewsMetafield?.value;
  if (SHOW_REVIEWS && reviewsRaw) {
    try {
      const parsed = JSON.parse(reviewsRaw) as { rating?: number }[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const ratings = parsed
          .map((r) => Number(r?.rating))
          .filter((n) => Number.isFinite(n) && n > 0);
        if (ratings.length > 0) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          rating = { avg: Math.round(avg * 10) / 10, count: ratings.length };
        }
      }
    } catch { /* malformed metafield — skip */ }
  }

  const minCmp = node.compareAtPriceRange?.minVariantCompareAtPrice;
  const maxCmp = node.compareAtPriceRange?.maxVariantCompareAtPrice;
  const compareAtPriceRange = minCmp?.amount
    ? {
        minVariantPrice: {
          amount: String(minCmp.amount),
          currencyCode: minCmp.currencyCode || currency,
        },
        maxVariantPrice: {
          amount: String(maxCmp?.amount ?? minCmp.amount),
          currencyCode: maxCmp?.currencyCode || currency,
        },
      }
    : null;

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
    compareAtPriceRange,
    variants: { edges: variants },
    images: {
      edges: imageNodes.map((img) => ({ node: img })),
    },
    rating,
    // Prefer the explicit metafield (clean, merchant-controlled). Fall back
    // to the first sentence of descriptionHtml only when no metafield is set
    // so cards always have something rather than nothing.
    tagline: node.taglineMetafield?.value?.trim() || extractTagline(bodyHtml),
    tags: node.tags ?? [],
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
  }>({
    // Cached read (CLAUDE.md: callers opt into force-cache + tags).
    // Without this the default is `no-store`, which also defeats the
    // unstable_cache wrapper in queries.ts — every render refetched.
    cache: "force-cache",
    tags: ["products"], query });

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
 * Lấy sản phẩm đang hoạt động. Kết hợp thêm bộ lọc tìm kiếm nếu có.
 *
 * Note: `published_status:published` có thể không ổn định theo channel/context
 * với Admin API trong một số shop, dẫn đến trả rỗng dù product vẫn hiển thị.
 * Vì vậy chỉ giữ `status:ACTIVE` để tránh false-negative.
 * @see https://shopify.dev/docs/api/usage/search-syntax
 */
const CATALOG_PRODUCT_SEARCH_BASE = "status:ACTIVE";

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
    // Cached read (CLAUDE.md: callers opt into force-cache + tags).
    // Without this the default is `no-store`, which also defeats the
    // unstable_cache wrapper in queries.ts — every render refetched.
    cache: "force-cache",
    tags: ["products"],
      query: gql,
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
    // Cached read (CLAUDE.md: callers opt into force-cache + tags).
    // Without this the default is `no-store`, which also defeats the
    // unstable_cache wrapper in queries.ts — every render refetched.
    cache: "force-cache",
    tags: ["products"],
    query: gql,
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
  /** Bypass the Next data cache — see adminGetFullProductsForPage's `fresh`. */
  fresh?: boolean,
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
    // Cached read (CLAUDE.md: callers opt into force-cache + tags), unless the
    // caller asked for a fresh read (live preview).
    ...(fresh
      ? { cache: "no-store" as const }
      : { cache: "force-cache" as const, tags: ["products"] }),
    query: gql,
    variables: { handle },
  });

  const p = res.body.data.productByHandle;
  if (!p) return undefined;
  return mapAdminProduct(p);
}
