import "server-only";

import { unstable_cache } from "next/cache";
import { adminGraphqlFetch } from "./admin-graphql";
import { hasAdminApiCredentials } from "./admin-credentials";

// Managed automatic BXGY discounts created by the beepaws-admin tool. Their
// title prefix + shape is a CROSS-REPO CONTRACT (see beepaws-admin
// docs/storefront-handoff-composed-kits.md §tier gifts):
//
// - "BeePaws Tier Gift" — tier gift: buy the product → 1 gift unit 100% off.
//                         The storefront adds the gift line; this discount is
//                         what makes it free — never render FREE without it.
//
// ("BeePaws Kit" kit-pricing discounts belonged to composed kits, scrapped
// 2026-10-11 — kits are Shopify bundles now, priced on the bundle itself.
// "BeePaws Free Gift" = the order-threshold gift, a separate future tool.)

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
            }
          }
        }
      }
    }
  }
`;

async function fetchBeePawsAutoDiscounts(): Promise<{ tierGifts: TierGiftDiscount[] }> {
  const empty = { tierGifts: [] };
  if (!hasAdminApiCredentials()) return empty;

  try {
    const res = await adminGraphqlFetch<DiscountNodesBody>({ query: DISCOUNTS_QUERY });
    const nodes = res.body.data?.discountNodes?.nodes ?? [];

    const tierGifts: TierGiftDiscount[] = [];
    for (const n of nodes) {
      const d = n.discount;
      if (d?.__typename !== "DiscountAutomaticBxgy") continue;
      if (d.status !== "ACTIVE" || !d.title?.startsWith("BeePaws Tier Gift")) continue;

      const buysProductIds = (d.customerBuys?.items?.products?.nodes ?? [])
        .map((p) => p.id)
        .filter((id): id is string => !!id);
      const getsProductIds = (d.customerGets?.items?.products?.nodes ?? [])
        .map((p) => p.id)
        .filter((id): id is string => !!id);
      if (buysProductIds.length === 0 || getsProductIds.length === 0) continue;

      tierGifts.push({ title: d.title, buysProductIds, getsProductIds });
    }

    return { tierGifts };
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
