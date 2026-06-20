import "server-only";

import type { BeepawsMetafields } from "@/types/metafields";
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
  descriptionHtml: string;
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
    title: string;
    description: string;
  };
  options: {
    id: string;
    name: string;
    values: string[];
  }[];
  featuredImage: {
    url: string;
    altText: string;
    width: number;
    height: number;
  } | null;
  images: {
    edges: {
      node: {
        url: string;
        altText: string;
        width: number;
        height: number;
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
    descriptionHtml: product.descriptionHtml ?? "",
    seo: {
      title: product.seo?.title || product.title,
      description: product.seo?.description || stripHtml(product.descriptionHtml),
    },
    featuredImage: product.featuredImage
      ? {
          url: product.featuredImage.url,
          altText: product.featuredImage.altText ?? "",
          width: product.featuredImage.width ?? 0,
          height: product.featuredImage.height ?? 0,
        }
      : null,
    images: {
      edges: (product.images.edges ?? []).map((edge) => ({
        node: {
          url: edge.node.url,
          altText: edge.node.altText ?? "",
          width: edge.node.width ?? 0,
          height: edge.node.height ?? 0,
        },
      })),
    },
    variants: product.variants,
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

function isProductReference(
  node: ShopifyNodeRef | null | undefined,
): node is { __typename: "Product"; id: string; handle: string; title: string } {
  return (
    !!node &&
    node.__typename === "Product" &&
    typeof (node as { id?: unknown }).id === "string" &&
    typeof (node as { handle?: unknown }).handle === "string" &&
    typeof (node as { title?: unknown }).title === "string"
  );
}

// Two metafield namespaces are in play:
//   - custom.*   (legacy / Shopify defaults) — usage_guide, qna, bundle_buy detection
//   - beepaws.*  (our own namespace) — all marketing/section content for the PDP
function normalizeMetafields(metafields: AdminMetafield[]) {
  const byKey: Record<string, AdminMetafield> = {};
  for (const mf of metafields) {
    byKey[`${mf.namespace}.${mf.key}`] = mf;
  }

  const usage =
    byKey["custom.usage_guide"] ||
    byKey["custom.how_to_use"] ||
    byKey["custom.usage"];
  const qna = byKey["custom.qna"] || byKey["custom.faq"] || byKey["custom.qa"];

  // Exclude `related_bundle` — it's a single product reference to a real Shopify
  // bundle (featured on this product's PDP), NOT a frequently-bought-together item.
  const bundleCandidates = metafields.filter(
    (mf) => looksLikeBundleKey(mf.key) && mf.key !== "related_bundle",
  );
  const bundleProducts = bundleCandidates.flatMap((mf) => {
    const referenced = mf.references?.nodes ?? [];
    const productsFromRefs = referenced
      .filter((node) => isProductReference(node))
      .map((node) => ({
        id: node.id,
        handle: node.handle,
        title: node.title,
      }));

    if (productsFromRefs.length > 0) return productsFromRefs;

    const single = mf.reference;
    if (isProductReference(single)) {
      return [{ id: single.id, handle: single.handle, title: single.title }];
    }
    return [];
  });

  // Extract beepaws.* namespace keys — populated via Shopify Admin metafield definitions
  const parseBeepaws = <T>(key: string): T | null => {
    const raw = byKey[`beepaws.${key}`]?.value ?? null;
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  };

  const beepaws: BeepawsMetafields = {
    comparisonRows:   parseBeepaws("comparison_rows"),
    useCases:         parseBeepaws("use_cases"),
    faqItems:         parseBeepaws("faq_items"),
    reviews:          parseBeepaws("reviews"),
    stats:            parseBeepaws("stats"),
    techSpecs:        parseBeepaws("tech_specs"),
    bullets:          parseBeepaws("product_bullets"),
    ingredients:      parseBeepaws("ingredients"),
    tagline:          byKey["beepaws.tagline"]?.value ?? null,
    educationNote:    byKey["beepaws.education_note"]?.value ?? null,
    beforeAfterSlides: parseBeepaws("before_after_slides"),
    bundleTiers:      parseBeepaws("bundle_tiers"),
    painPoints:       parseBeepaws("pain_points"),
    painPointsIntro:  parseBeepaws("pain_points_intro"),
    mechanismSteps:   parseBeepaws("mechanism_steps"),
    mechanismIntro:   parseBeepaws("mechanism_intro"),
    guarantee:        parseBeepaws("guarantee"),
    useCasesIntro:    parseBeepaws("use_cases_intro"),
    comparisonIntro:  parseBeepaws("comparison_intro"),
    faqIntro:         parseBeepaws("faq_intro"),
    reviewsIntro:     parseBeepaws("reviews_intro"),
    beforeAfterIntro: parseBeepaws("before_after_intro"),
    finalCtaCopy:     parseBeepaws("final_cta_copy"),
  };

  // `beepaws.related_bundle` — a single product reference to the bundle to
  // feature on this product's PDP (replaces the price row with a bundle offer).
  const relatedBundleRef = byKey["beepaws.related_bundle"]?.reference;
  const related_bundle = isProductReference(relatedBundleRef)
    ? { id: relatedBundleRef.id, handle: relatedBundleRef.handle, title: relatedBundleRef.title }
    : null;

  return {
    usage_guide: usage
      ? {
          source: `${usage.namespace}.${usage.key}`,
          type: usage.type,
          parsed: parseJsonValue(usage.value),
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
    related_bundle,
    beepaws,
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
