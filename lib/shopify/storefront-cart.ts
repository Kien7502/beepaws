import "server-only";

import { shopifyFetch } from "./index";

/** Legacy cookie from the retired merge-into-cookie-cart flow. Still exported
 * so the checkout route can DELETE it — carts it points at accumulated every
 * buy-now line for 14 days and must not be resurrected. */
export const SHOPIFY_CART_COOKIE = "shopify_storefront_cart_id";

type CartOpResult = {
  data?: {
    cartCreate?: {
      cart?: { id?: string; checkoutUrl?: string };
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
  return { cartId: cart.id, checkoutUrl: cart.checkoutUrl };
}
