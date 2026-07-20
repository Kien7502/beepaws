import "server-only";

import { unstable_cache } from "next/cache";
import { adminGraphqlFetch } from "./admin-graphql";
import { hasAdminApiCredentials } from "./admin-credentials";

// Managed automatic BXGY discounts created by the beepaws-admin tool. Their
// title prefixes + shapes are CROSS-REPO CONTRACTS (see beepaws-admin
// docs/storefront-handoff-composed-kits.md):
//
// - "BeePaws Kit"       — kit pricing: buy the main product → N add-on units
//                         % off (cheapest first). Display math derives from
//                         the discount, never hardcoded. NOT applicable to
//                         subscribed lines (platform limit, verified live).
// - "BeePaws Tier Gift" — tier gift: buy the product → 1 gift unit 100% off.
//                         The storefront adds the gift line; this discount is
//                         what makes it free — never render FREE without it.
//
// ("BeePaws Free Gift" = the order-threshold gift, a separate future tool.)

export type KitDiscount = {
  title: string;
  /** Products on the customerBuys side (the kit's main product). */
  buysProductIds: string[];
  /** Products eligible for the discount (the kit's add-ons). */
  getsProductIds: string[];
  /** TOTAL discounted units across the gets set (cheapest first). */
  unitQuantity: number;
  /** 0..1 — Shopify's DiscountPercentage. */
  percentage: number;
};

export type TierGiftDiscount = {
  title: string;
  buysProductIds: string[];
  getsProductIds: string[];
};

type DiscountNodesBody = {
  data?: {
    discountNodes?: {
      nodes?: {
        discount?: {
          __typename?: string;
          title?: string;
          status?: string;
          customerBuys?: {
            items?: { products?: { nodes?: { id?: string }[] } };
          };
          customerGets?: {
            items?: { products?: { nodes?: { id?: string }[] } };
            value?: {
              quantity?: { quantity?: string | number };
              effect?: { percentage?: number };
            };
          };
        };
      }[];
    };
  };
};

const DISCOUNTS_QUERY = `
  query BeePawsAutoDiscounts {
    discountNodes(first: 50, query: "title:BeePaws*") {
      nodes {
        discount {
          __typename
          ... on DiscountAutomaticBxgy {
            title
            status
            customerBuys {
              items {
                ... on DiscountProducts { products(first: 20) { nodes { id } } }
              }
            }
            customerGets {
              items {
                ... on DiscountProducts { products(first: 20) { nodes { id } } }
              }
              value {
                ... on DiscountOnQuantity {
                  quantity { quantity }
                  effect { ... on DiscountPercentage { percentage } }
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchBeePawsAutoDiscounts(): Promise<{
  kits: KitDiscount[];
  tierGifts: TierGiftDiscount[];
}> {
  const empty = { kits: [], tierGifts: [] };
  if (!hasAdminApiCredentials()) return empty;

  try {
    const res = await adminGraphqlFetch<DiscountNodesBody>({ query: DISCOUNTS_QUERY });
    const nodes = res.body.data?.discountNodes?.nodes ?? [];

    const kits: KitDiscount[] = [];
    const tierGifts: TierGiftDiscount[] = [];

    for (const n of nodes) {
      const d = n.discount;
      if (d?.__typename !== "DiscountAutomaticBxgy") continue;
      if (d.status !== "ACTIVE" || !d.title) continue;

      const buysProductIds = (d.customerBuys?.items?.products?.nodes ?? [])
        .map((p) => p.id)
        .filter((id): id is string => !!id);
      const getsProductIds = (d.customerGets?.items?.products?.nodes ?? [])
        .map((p) => p.id)
        .filter((id): id is string => !!id);
      if (buysProductIds.length === 0 || getsProductIds.length === 0) continue;

      if (d.title.startsWith("BeePaws Kit")) {
        const percentage = d.customerGets?.value?.effect?.percentage ?? 0;
        const unitQuantity = Number(d.customerGets?.value?.quantity?.quantity ?? 0);
        if (percentage > 0 && unitQuantity > 0) {
          kits.push({ title: d.title, buysProductIds, getsProductIds, unitQuantity, percentage });
        }
      } else if (d.title.startsWith("BeePaws Tier Gift")) {
        tierGifts.push({ title: d.title, buysProductIds, getsProductIds });
      }
    }

    return { kits, tierGifts };
  } catch {
    // Discounts are display enhancements — never a page blocker.
    return empty;
  }
}

// Same caching pattern as lib/shopify/queries.ts: unstable_cache in prod
// (Admin GraphQL is POST — no fetch-level caching), passthrough in dev.
const cached =
  process.env.NODE_ENV === "production"
    ? unstable_cache(fetchBeePawsAutoDiscounts, ["beepaws-auto-discounts"], {
        tags: ["products"],
        revalidate: 3600,
      })
    : fetchBeePawsAutoDiscounts;

export function getBeePawsAutoDiscounts() {
  return cached();
}
