import "server-only";

import { adminGraphqlFetch } from "./admin-graphql";

type ShopifyNodeRef =
  | {
      __typename: "Product";
      id: string;
      handle: string;
      title: string;
    }
  | {
      __typename: "Collection";
      id: string;
      handle: string;
      title: string;
    }
  | {
      __typename: "Metaobject";
      id: string;
      type: string;
      handle: string | null;
      fields: {
        key: string;
        type: string;
        value: string | null;
      }[];
    }
  | {
      __typename: string;
      id?: string;
    };

type AdminMetafield = {
  namespace: string;
  key: string;
  type: string;
  value: string | null;
  reference: ShopifyNodeRef | null;
  references: {
    nodes: ShopifyNodeRef[];
  } | null;
};

type AdminProductFull = {
  id: string;
  handle: string;
  title: string;
  status: string;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  descriptionHtml: string | null;
  description: string;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  seo: {
    title: string | null;
    description: string | null;
  } | null;
  options: {
    id: string;
    name: string;
    values: string[];
  }[];
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
  collections: {
    edges: {
      node: {
        id: string;
        handle: string;
        title: string;
      };
    }[];
  };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        sku: string | null;
        barcode: string | null;
        price: string;
        compareAtPrice: string | null;
        selectedOptions: {
          name: string;
          value: string;
        }[];
      };
    }[];
  };
  metafields: {
    edges: {
      node: AdminMetafield;
    }[];
  };
};

function parseJsonValue(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function stripHtml(html: string | null | undefined): string {
  const s = html ?? "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function withDerivedFields(product: Omit<AdminProductFull, "description" | "availableForSale" | "priceRange">): AdminProductFull {
  const prices = product.variants.edges
    .map((edge) => Number(edge.node.price))
    .filter((v) => Number.isFinite(v));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const anyVariantAvailable = product.variants.edges.some(
    (edge) => edge.node.availableForSale,
  );

  return {
    ...product,
    description: stripHtml(product.descriptionHtml) || product.title,
    availableForSale: product.status === "ACTIVE" && anyVariantAvailable,
    priceRange: {
      minVariantPrice: { amount: String(min), currencyCode: "USD" },
      maxVariantPrice: { amount: String(max), currencyCode: "USD" },
    },
  };
}

function looksLikeBundleKey(key: string): boolean {
  return /(bundle|upsell|cross_sell|crosssell|frequently_bought|fbt|recommended)/i.test(
    key,
  );
}

function normalizeMetafields(metafields: AdminMetafield[]) {
  const byKey: Record<string, AdminMetafield> = {};
  for (const mf of metafields) {
    byKey[`${mf.namespace}.${mf.key}`] = mf;
  }

  const usage =
    byKey["custom.usage_guide"] ||
    byKey["custom.how_to_use"] ||
    byKey["custom.usage"];
  const specifications =
    byKey["custom.specifications"] || byKey["custom.specs"];
  const qna = byKey["custom.qna"] || byKey["custom.faq"] || byKey["custom.qa"];

  const bundleCandidates = metafields.filter((mf) => looksLikeBundleKey(mf.key));
  const bundleProducts = bundleCandidates.flatMap((mf) => {
    const referenced = mf.references?.nodes ?? [];
    const productsFromRefs = referenced
      .filter((node): node is Extract<ShopifyNodeRef, { __typename: "Product" }> => node.__typename === "Product")
      .map((node) => ({
        id: node.id,
        handle: node.handle,
        title: node.title,
      }));

    if (productsFromRefs.length > 0) return productsFromRefs;

    const single = mf.reference;
    if (single && single.__typename === "Product") {
      return [{ id: single.id, handle: single.handle, title: single.title }];
    }
    return [];
  });

  return {
    usage_guide: usage
      ? {
          source: `${usage.namespace}.${usage.key}`,
          type: usage.type,
          parsed: parseJsonValue(usage.value),
        }
      : null,
    specifications: specifications
      ? {
          source: `${specifications.namespace}.${specifications.key}`,
          type: specifications.type,
          parsed: parseJsonValue(specifications.value),
        }
      : null,
    qna: qna
      ? {
          source: `${qna.namespace}.${qna.key}`,
          type: qna.type,
          parsed: parseJsonValue(qna.value),
        }
      : null,
    bundle_buy: bundleProducts,
  };
}

const PRODUCT_FULL_FRAGMENT = `
  fragment ProductFullForPage on Product {
    id
    handle
    title
    status
    vendor
    productType
    tags
    descriptionHtml
    seo {
      title
      description
    }
    options {
      id
      name
      values
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 40) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    collections(first: 20) {
      edges {
        node {
          id
          handle
          title
        }
      }
    }
    variants(first: 250) {
      edges {
        node {
          id
          title
          availableForSale
          sku
          barcode
          price
          compareAtPrice
          selectedOptions {
            name
            value
          }
        }
      }
    }
    metafields(first: 120) {
      edges {
        node {
          namespace
          key
          type
          value
          reference {
            __typename
            ... on Product {
              id
              handle
              title
            }
            ... on Collection {
              id
              handle
              title
            }
            ... on Metaobject {
              id
              type
              handle
              fields {
                key
                type
                value
              }
            }
          }
          references(first: 20) {
            nodes {
              __typename
              ... on Product {
                id
                handle
                title
              }
              ... on Collection {
                id
                handle
                title
              }
              ... on Metaobject {
                id
                type
                handle
                fields {
                  key
                  type
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function adminGetFullProductsForPage(opts?: {
  handle?: string;
  first?: number;
}) {
  if (opts?.handle) {
    const query = `
      ${PRODUCT_FULL_FRAGMENT}
      query ProductFullByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          ...ProductFullForPage
        }
      }
    `;
    const res = await adminGraphqlFetch<{
      data: {
        productByHandle: Omit<
          AdminProductFull,
          "description" | "availableForSale" | "priceRange"
        > | null;
      };
    }>({
      query,
      variables: { handle: opts.handle },
      tags: ["products", "product-full"],
    });

    const rawProduct = res.body.data.productByHandle;
    const product = rawProduct ? withDerivedFields(rawProduct) : null;
    if (!product) return [];
    const metafields = product.metafields.edges.map((e) => e.node);
    return [
      {
        ...product,
        normalized: normalizeMetafields(metafields),
      },
    ];
  }

  const first = Math.max(1, Math.min(opts?.first ?? 50, 250));
  const query = `
    ${PRODUCT_FULL_FRAGMENT}
    query ProductsFull($first: Int!, $query: String!) {
      products(first: $first, query: $query, sortKey: TITLE) {
        edges {
          node {
            ...ProductFullForPage
          }
        }
      }
    }
  `;

  const res = await adminGraphqlFetch<{
    data: {
      products: {
        edges: {
          node: Omit<
            AdminProductFull,
            "description" | "availableForSale" | "priceRange"
          >;
        }[];
      };
    };
  }>({
    query,
    variables: {
      first,
      query: "status:ACTIVE",
    },
    tags: ["products", "product-full"],
  });

  return res.body.data.products.edges.map((edge) => {
    const product = withDerivedFields(edge.node);
    const metafields = product.metafields.edges.map((e) => e.node);
    return {
      ...product,
      normalized: normalizeMetafields(metafields),
    };
  });
}

export type AdminFullProductForPage = Awaited<
  ReturnType<typeof adminGetFullProductsForPage>
>[number];
