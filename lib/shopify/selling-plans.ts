import "server-only";

import { shopifyFetch } from "./index";

// Selling plans for the PDP "Subscribe & Save" selector. DORMANT since the
// owner's 2026-07-21 decision to sell one-time and convert to subscription by
// email instead: no product currently has a plan, so this returns [] and the
// selector never renders. Kept because it reactivates the moment a plan is
// attached to a product. Plans are created and
// billed by the official Shopify Subscriptions app; the storefront only reads
// them and puts a sellingPlanId on the cart line — Shopify checkout and the
// app handle the agreement, renewals, and the customer portal from there.
//
// This goes through the STOREFRONT API (not the Admin API the catalog uses):
// selling plans + per-variant allocation prices are first-class there and the
// public storefront token already has access. When that token isn't
// configured, products simply render without a subscribe option.

export interface SellingPlanOption {
  /** gid://shopify/SellingPlan/… — goes on the cart line as sellingPlanId. */
  id: string;
  /** e.g. "Deliver every 2 weeks, 15% off" — cadence + discount in one line. */
  name: string;
  /** Adjusted per-delivery price per variant id, from sellingPlanAllocations —
   * Shopify's own math, never recomputed from the percentage here. */
  pricesByVariant: Record<string, { amount: string; currencyCode: string }>;
}

type PlansQueryBody = {
  data?: {
    product?: {
      sellingPlanGroups?: {
        nodes?: {
          name?: string;
          sellingPlans?: { nodes?: { id?: string; name?: string }[] };
        }[];
      };
      variants?: {
        nodes?: {
          id?: string;
          sellingPlanAllocations?: {
            nodes?: {
              sellingPlan?: { id?: string };
              priceAdjustments?: {
                perDeliveryPrice?: { amount?: string; currencyCode?: string };
                price?: { amount?: string; currencyCode?: string };
              }[];
            }[];
          };
        }[];
      };
    } | null;
  };
};

const PLANS_QUERY = `
  query ProductSellingPlans($handle: String!) {
    product(handle: $handle) {
      sellingPlanGroups(first: 5) {
        nodes {
          name
          sellingPlans(first: 5) {
            nodes { id name }
          }
        }
      }
      variants(first: 50) {
        nodes {
          id
          sellingPlanAllocations(first: 10) {
            nodes {
              sellingPlan { id }
              priceAdjustments {
                perDeliveryPrice { amount currencyCode }
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
  }
`;

/** All selling plans on a product, flattened across groups. Empty array when
 * the product has none, the storefront token isn't configured, or the query
 * fails (the PDP then renders exactly as before — no subscribe selector). */
export async function getSellingPlans(handle: string): Promise<SellingPlanOption[]> {
  if (!process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim()) return [];

  try {
    // silent: this query needs the unauthenticated_read_selling_plans scope on
    // the storefront token (older tokens won't have it) — until it's granted
    // the call fails on every render, and an optional enhancement degrading
    // to "no selector" must not spam the console/dev overlay.
    const res = await shopifyFetch<PlansQueryBody>({
      query: PLANS_QUERY,
      variables: { handle },
      cache: "force-cache",
      tags: ["products"],
      silent: true,
    });

    const product = res.body.data?.product;
    if (!product) return [];

    const plans: SellingPlanOption[] = [];
    for (const group of product.sellingPlanGroups?.nodes ?? []) {
      for (const plan of group.sellingPlans?.nodes ?? []) {
        if (plan.id && plan.name) {
          plans.push({ id: plan.id, name: plan.name, pricesByVariant: {} });
        }
      }
    }
    if (plans.length === 0) return [];

    for (const variant of product.variants?.nodes ?? []) {
      if (!variant.id) continue;
      for (const alloc of variant.sellingPlanAllocations?.nodes ?? []) {
        const planId = alloc.sellingPlan?.id;
        const adj = alloc.priceAdjustments?.[0];
        const price = adj?.perDeliveryPrice ?? adj?.price;
        if (!planId || !price?.amount || !price.currencyCode) continue;
        const plan = plans.find((p) => p.id === planId);
        if (plan) {
          plan.pricesByVariant[variant.id] = {
            amount: price.amount,
            currencyCode: price.currencyCode,
          };
        }
      }
    }
    return plans;
  } catch {
    // Selling plans are an enhancement, never a page-blocker.
    return [];
  }
}
