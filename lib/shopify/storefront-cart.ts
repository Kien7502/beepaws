import "server-only";

import { shopifyFetch } from "./index";

export const SHOPIFY_CART_COOKIE = "shopify_storefront_cart_id";

type CartOpResult = {
  data?: {
    cartCreate?: {
      cart?: { id?: string; checkoutUrl?: string };
      userErrors?: { field?: string[]; message: string }[];
    };
    cartLinesAdd?: {
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

const CART_LINES_ADD = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
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

async function createCartWithLines(
  lines: { merchandiseId: string; quantity: number }[],
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

async function addLinesToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<{ cartId: string; checkoutUrl: string }> {
  const res = await shopifyFetch<CartOpResult>({
    query: CART_LINES_ADD,
    variables: {
      cartId,
      lines,
    },
    cache: "no-store",
  });

  const payload = res.body.data?.cartLinesAdd;
  const errs = payload?.userErrors?.map((e) => e.message).join("; ");
  const cart = payload?.cart;
  if (errs || !cart?.id || !cart.checkoutUrl) {
    throw new Error(errs || "cartLinesAdd returned no cart");
  }
  return { cartId: cart.id, checkoutUrl: cart.checkoutUrl };
}

/**
 * Create a cart or merge into an existing cart id, then return Shopify Checkout URL.
 */
export async function mergeCartAndGetCheckoutUrl(
  existingCartId: string | undefined,
  merchandiseId: string,
  quantity: number,
): Promise<{ cartId: string; checkoutUrl: string }> {
  const line = { merchandiseId, quantity };

  if (existingCartId?.trim()) {
    try {
      return await addLinesToCart(existingCartId.trim(), [line]);
    } catch {
      // Cart may have expired — create fresh
    }
  }

  return createCartWithLines([line]);
}
