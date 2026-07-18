import "server-only";

import { shopifyFetch } from "./index";

/** Legacy cookie from the retired merge-into-cookie-cart flow. Still exported
 * so the checkout route can DELETE it — carts it points at accumulated every
 * buy-now line for 14 days and must not be resurrected. */
export const SHOPIFY_CART_COOKIE = "shopify_storefront_cart_id";

type CartOpResult = {
  data?: {
    cartCreate?: {
      cart?: { id?: string; checkoutUrl?: string; totalQuantity?: number };
      userErrors?: { field?: string[]; message: string }[];
    };
  };
};

const CART_CREATE = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// sellingPlanId (Subscribe & Save) rides along when present; omitted keys —
// not nulls — for one-time lines, matching CartLineInput's expectations.
export type CheckoutLine = {
  merchandiseId: string;
  quantity: number;
  sellingPlanId?: string;
};

/** Thrown when Shopify silently ghosts a posted line (unsellable variant).
 * The checkout route must surface this to the user, NOT retry via the cart
 * permalink — the permalink would carry the same unsellable variant. */
export class UnsellableLinesError extends Error {}

/** Checkout means "exactly these lines": always a FRESH cart. Reusing a
 * persistent cart and adding lines (the old merge flow) made every buy-now
 * stack onto up to 14 days of previous test lines at Shopify checkout. */
export async function createCartWithLines(
  lines: CheckoutLine[],
): Promise<{ cartId: string; checkoutUrl: string }> {
  const res = await shopifyFetch<CartOpResult>({
    query: CART_CREATE,
    variables: {
      input: { lines },
    },
    cache: "no-store",
  });

  const payload = res.body.data?.cartCreate;
  const errs = payload?.userErrors?.map((e) => e.message).join("; ");
  const cart = payload?.cart;
  if (errs || !cart?.id || !cart.checkoutUrl) {
    throw new Error(errs || "cartCreate returned no cart");
  }

  // GHOST-LINE guard: a variant the storefront channel can't sell (archived /
  // unpublished product) is silently dropped from the cart's visible lines —
  // NO userErrors — while still being counted in the cost (verified live
  // 2026-07-18). totalQuantity only counts visible lines, so a shortfall means
  // some posted line got ghosted; fail loudly rather than hand back a checkout
  // for a cart the customer can't see the contents of.
  const expectedQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  if ((cart.totalQuantity ?? expectedQuantity) < expectedQuantity) {
    throw new UnsellableLinesError(
      "Some items are not available for purchase right now — they may be unpublished or archived in Shopify.",
    );
  }

  return { cartId: cart.id, checkoutUrl: cart.checkoutUrl };
}
