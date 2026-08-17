// Client-safe Shopify Storefront Cart API calls.
// NEXT_PUBLIC_ tokens are intentionally public — safe to call from the browser.

import {
  GQL_GET_CART,
  GQL_CART_CREATE,
  GQL_CART_LINES_ADD,
  GQL_CART_LINES_UPDATE,
  GQL_CART_LINES_REMOVE,
  buildReturnAttributes,
} from "./mutations";

// ─── Types ────────────────────────────────────────────────────────────────────

type RawMoney = { amount: string; currencyCode: string };

type RawCartLine = {
  id: string;
  quantity: number;
  cost?: {
    subtotalAmount?: RawMoney | null;
    totalAmount?: RawMoney | null;
  } | null;
  sellingPlanAllocation?: {
    sellingPlan?: { id: string; name: string } | null;
  } | null;
  merchandise: {
    id: string;
    title: string;
    price: RawMoney;
    product: {
      title: string;
      handle: string;
      images: { edges: { node: { url: string; altText: string | null } }[] };
    };
  };
};

type RawCart = {
  id: string;
  checkoutUrl: string;
  lines: { edges: { node: RawCartLine }[] };
  cost: { subtotalAmount: RawMoney };
};

export type CartLine = {
  lineId: string;
  merchandiseId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  imageUrl: string;
  currencyCode: string;
  unitPriceAmount: string;
  quantity: number;
  /** Subscription plan on this line (Subscribe & Save). Same variant with a
   * different plan (or none) is a DIFFERENT cart line. */
  sellingPlanId?: string | null;
  sellingPlanName?: string | null;
  /** Shopify's line cost AFTER automatic discounts (BeePaws Kit / Tier Gift
   * BXGYs apply in the cart itself — verified live 2026-07-19). The drawer
   * shows this over unitPrice×qty when they differ; 0 renders as FREE. */
  lineTotalAmount?: string | null;
  /** Line cost before discounts — the struck price beside a discounted one. */
  lineSubtotalAmount?: string | null;
};

/** One cart line to add: sellingPlanId rides along for subscriptions. */
export type AddLineInput = {
  merchandiseId: string;
  quantity: number;
  sellingPlanId?: string | null;
};

// Shopify's CartLineInput rejects explicit nulls less gracefully than absent
// fields — strip the plan key entirely for one-time lines.
function toApiLines(lines: AddLineInput[]) {
  return lines.map((l) => ({
    merchandiseId: l.merchandiseId,
    quantity: l.quantity,
    ...(l.sellingPlanId ? { sellingPlanId: l.sellingPlanId } : {}),
  }));
}

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  subtotalAmount: string;
  subtotalCurrency: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

export function hasStorefrontConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
  );
}

function buildEndpoint(): string {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const version =
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION ?? "2025-10";
  if (!domain) throw new Error("NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN not set");
  const host = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}/api/${version}/graphql.json`;
}

// ─── Low-level fetch ──────────────────────────────────────────────────────────

async function storefrontPost<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? "";
  const res = await fetch(buildEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Shopify cart HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapCart(raw: RawCart): ShopifyCart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    subtotalAmount: raw.cost.subtotalAmount.amount,
    subtotalCurrency: raw.cost.subtotalAmount.currencyCode,
    lines: raw.lines.edges.map(({ node }) => ({
      lineId: node.id,
      merchandiseId: node.merchandise.id,
      productHandle: node.merchandise.product.handle,
      productTitle: node.merchandise.product.title,
      variantTitle:
        node.merchandise.title === "Default Title"
          ? ""
          : node.merchandise.title,
      imageUrl:
        node.merchandise.product.images.edges[0]?.node.url ??
        "/product-placeholder.svg",
      currencyCode: node.merchandise.price.currencyCode,
      unitPriceAmount: node.merchandise.price.amount,
      quantity: node.quantity,
      sellingPlanId: node.sellingPlanAllocation?.sellingPlan?.id ?? null,
      sellingPlanName: node.sellingPlanAllocation?.sellingPlan?.name ?? null,
      lineTotalAmount: node.cost?.totalAmount?.amount ?? null,
      lineSubtotalAmount: node.cost?.subtotalAmount?.amount ?? null,
    })),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    const data = await storefrontPost<{ cart: RawCart | null }>(GQL_GET_CART, {
      cartId,
    });
    return data.cart ? mapCart(data.cart) : null;
  } catch {
    return null;
  }
}

export async function createCart(lines: AddLineInput[]): Promise<ShopifyCart> {
  const data = await storefrontPost<{
    cartCreate: { cart: RawCart; userErrors: { message: string }[] };
  }>(GQL_CART_CREATE, { lines: toApiLines(lines), attributes: buildReturnAttributes() });
  const { cart, userErrors } = data.cartCreate;
  if (userErrors.length) throw new Error(userErrors[0].message);
  return mapCart(cart);
}

export async function addCartLines(
  cartId: string,
  lines: AddLineInput[],
): Promise<ShopifyCart> {
  const data = await storefrontPost<{
    cartLinesAdd: { cart: RawCart; userErrors: { message: string }[] };
  }>(GQL_CART_LINES_ADD, { cartId, lines: toApiLines(lines) });
  const { cart, userErrors } = data.cartLinesAdd;
  if (userErrors.length) throw new Error(userErrors[0].message);
  return mapCart(cart);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<ShopifyCart> {
  const data = await storefrontPost<{
    cartLinesUpdate: { cart: RawCart; userErrors: { message: string }[] };
  }>(GQL_CART_LINES_UPDATE, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });
  const { cart, userErrors } = data.cartLinesUpdate;
  if (userErrors.length) throw new Error(userErrors[0].message);
  return mapCart(cart);
}

export async function removeCartLine(
  cartId: string,
  lineId: string,
): Promise<ShopifyCart> {
  const data = await storefrontPost<{
    cartLinesRemove: { cart: RawCart; userErrors: { message: string }[] };
  }>(GQL_CART_LINES_REMOVE, { cartId, lineIds: [lineId] });
  const { cart, userErrors } = data.cartLinesRemove;
  if (userErrors.length) throw new Error(userErrors[0].message);
  return mapCart(cart);
}
