import "server-only";

import { unstable_cache } from "next/cache";
import { adminGraphqlFetch } from "./admin-graphql";
import { hasAdminApiCredentials } from "./admin-credentials";
import type { Product } from "@/types/shopify";
import type { VariantGroupMember } from "@/types/metafields";

// Variant groups = the Combined Listings pattern, implemented storefront-side
// (admin handoff 2026-07-21, docs/admin-handoff-variant-groups.md). Several
// separate Shopify products — each fully supplier-synced — are presented as
// options on ONE PDP.
//
// Membership is derived from the metafield itself, never from tags, so there
// is exactly one source of truth: a product is a NON-PRIMARY member when it
// appears in some OTHER product's `beepaws.variant_group`.

type IndexBody = {
  data?: {
    products?: {
      nodes?: {
        handle?: string;
        metafield?: { value?: string } | null;
      }[];
    };
  };
};

const INDEX_QUERY = `
  query VariantGroupIndex {
    products(first: 250) {
      nodes {
        handle
        metafield(namespace: "beepaws", key: "variant_group") { value }
      }
    }
  }
`;

/** memberHandle → primaryHandle, for every member EXCEPT the primary itself. */
export type VariantGroupIndex = Record<string, string>;

async function fetchVariantGroupIndex(): Promise<VariantGroupIndex> {
  if (!hasAdminApiCredentials()) return {};

  try {
    const res = await adminGraphqlFetch<IndexBody>({ query: INDEX_QUERY });
    const nodes = res.body.data?.products?.nodes ?? [];
    const index: VariantGroupIndex = {};

    for (const node of nodes) {
      const primary = node.handle;
      const raw = node.metafield?.value;
      if (!primary || !raw) continue;

      let members: VariantGroupMember[];
      try {
        members = JSON.parse(raw) as VariantGroupMember[];
      } catch {
        continue;
      }
      if (!Array.isArray(members)) continue;

      for (const m of members) {
        const handle = m?.product?.handle;
        // The primary lists itself — that entry is not a redirect target.
        if (!handle || handle === primary) continue;
        index[handle] = primary;
      }
    }

    return index;
  } catch {
    // Never a page blocker: no index = every product renders standalone.
    return {};
  }
}

// Admin GraphQL is POST (no fetch-level caching), so wrap like queries.ts —
// passthrough in dev so metafield edits show up on the next request.
const cached =
  process.env.NODE_ENV === "production"
    ? unstable_cache(fetchVariantGroupIndex, ["beepaws-variant-group-index"], {
        tags: ["products"],
        revalidate: 3600,
      })
    : fetchVariantGroupIndex;

export function getVariantGroupIndex(): Promise<VariantGroupIndex> {
  return cached();
}

/** The primary's handle when `handle` is a non-primary member, else null. */
export async function getVariantGroupPrimary(handle: string): Promise<string | null> {
  const index = await getVariantGroupIndex();
  return index[handle] ?? null;
}

/**
 * Listing rule (contract §3): show the primary only, hide the other members —
 * one page per group instead of near-duplicate rows. Members stay PUBLISHED
 * (the Storefront API can't fetch unpublished products and the primary PDP
 * needs their variants for the cart), so hiding is a listing concern only.
 */
export async function withoutVariantGroupMembers(products: Product[]): Promise<Product[]> {
  const index = await getVariantGroupIndex();
  if (Object.keys(index).length === 0) return products;
  return products.filter((p) => !index[p.handle]);
}
