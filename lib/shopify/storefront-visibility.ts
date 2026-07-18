import "server-only";

import { shopifyFetch } from "./index";

type VisibilityBody = { data?: { product?: { id?: string } | null } };

const VISIBILITY_QUERY = `
  query StorefrontVisibility($handle: String!) {
    product(handle: $handle) { id }
  }
`;

/**
 * Whether the storefront sales channel can actually SELL this product.
 *
 * The catalog reads through the Admin API, which happily returns ARCHIVED /
 * DRAFT / channel-unpublished products — but the Storefront Cart API turns
 * their variants into GHOST lines: no userErrors, absent from `cart.lines`,
 * yet still counted in `cost.subtotalAmount` (verified live 2026-07-18 with
 * the archived Starter Bundle). Anything the UI offers to add to the cart
 * must pass this check first.
 *
 * Returns null when the storefront token isn't configured or the check
 * fails — "couldn't check" is not "unpublished", callers should not hide
 * the offer on null.
 */
export async function isSellableOnStorefront(handle: string): Promise<boolean | null> {
  if (!process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim()) return null;

  try {
    const res = await shopifyFetch<VisibilityBody>({
      query: VISIBILITY_QUERY,
      variables: { handle },
      cache: "force-cache",
      tags: ["products"],
      silent: true,
    });
    return !!res.body.data?.product;
  } catch {
    return null;
  }
}
