import "server-only";

import { randomBytes } from "node:crypto";
import { adminGraphqlFetch } from "./admin-graphql";
import { hasAdminApiCredentials } from "./admin-credentials";
import { shopifyFetch } from "./index";

/**
 * Free standard shipping on kits, one code PER CART (owner, 2026-10-15).
 *
 * Shopify can't target free shipping at products: bundles can't join a shipping
 * profile, and a free-shipping discount only takes a minimum spend/quantity.
 * So the storefront does the targeting: when a cart holds a kit (a Shopify
 * bundle — `requiresComponents`, tagged "bundle"), it gets its own free-shipping
 * CODE, created here through the Admin API:
 *   - minimum spend = that cart's kit total (× (1 − promo allowance)), so typed
 *     onto any other order it does nothing — and a cheaper kit added to the
 *     catalogue later can't loosen it, unlike one shared code (owner's point);
 *   - single use, expiring after `hours` (default 48) — a returning shopper just
 *     gets a fresh one, so the expiry never costs them the free shipping;
 *   - `maximumShippingPrice` caps it to Standard ($8 today), Express stays paid;
 *   - combines with product (tier gifts) and order (promo) discounts.
 * The cart remembers its code in the private `_kitship` attribute. Codes are
 * replaced when the kit total changes or expiry nears, removed (and deleted)
 * when the last kit leaves, and expired ones are swept on each new creation.
 *
 * Settings live in the shop metafield `beepaws.kit_shipping`, written by the
 * admin tool's Discounts → "Free shipping on kits" card. Off until switched on.
 * CROSS-REPO CONTRACT: beepaws-admin lib/kit-shipping.ts (keep the sanitizers,
 * the title prefix and the code prefix in step).
 */

export type KitShippingConfig = {
  enabled: boolean;
  /** Code lifetime in hours. */
  hours: number;
  /** Shipping rates up to this price are made free (keeps Express paid). */
  maxShippingPrice: number;
  /** % below the kit total the minimum may sit, so a promo code doesn't push a
   *  kit order under it (Shopify checks the minimum AFTER other discounts). */
  promoAllowance: number;
  /** Store-wide cap on live codes: carts are public, so a script could make
   *  thousands; past this many no new code is made (that cart just gets
   *  standard shipping) until older ones expire and are swept. */
  maxLiveCodes: number;
};

export const KIT_SHIPPING_TITLE = "BeePaws Kit Shipping";
export const KIT_SHIPPING_CODE_PREFIX = "KITSHIP-";
const ATTRIBUTE_KEY = "_kitship";
/** A code this close to expiring is replaced rather than handed to checkout. */
const RENEW_WITHIN_MS = 60 * 60 * 1000;

const DEFAULTS: KitShippingConfig = { enabled: false, hours: 48, maxShippingPrice: 10, promoAllowance: 0, maxLiveCodes: 500 };

const num = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

export function sanitizeKitShipping(raw: unknown): KitShippingConfig {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    enabled: o.enabled === true,
    hours: Math.round(num(o.hours, 1, 24 * 14, DEFAULTS.hours)),
    maxShippingPrice: num(o.maxShippingPrice, 0, 1000, DEFAULTS.maxShippingPrice),
    promoAllowance: num(o.promoAllowance, 0, 50, DEFAULTS.promoAllowance),
    maxLiveCodes: Math.round(num(o.maxLiveCodes, 10, 100_000, DEFAULTS.maxLiveCodes)),
  };
}

// ─── Settings (shop metafield), cached briefly per server instance ───────────

let cached: { at: number; value: KitShippingConfig } | null = null;

async function readConfig(): Promise<KitShippingConfig> {
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  const res = await adminGraphqlFetch<{ data?: { shop?: { metafield?: { value?: string } | null } } }>({
    query: `{ shop { metafield(namespace: "beepaws", key: "kit_shipping") { value } } }`,
  });
  let value = DEFAULTS;
  const raw = res.body.data?.shop?.metafield?.value;
  if (raw) {
    try {
      value = sanitizeKitShipping(JSON.parse(raw));
    } catch {
      /* malformed → defaults (off) */
    }
  }
  cached = { at: Date.now(), value };
  return value;
}

/**
 * For the product page: is free shipping on kits switched on? Read through
 * Next's data cache under the "products" tag, so the PDP stays static (ISR) —
 * an uncached read here would make every product page dynamic. The admin card
 * refreshes the tag when it saves, the same way a Push does. (The cart route
 * reads the settings through the short in-memory cache above instead.)
 */
export async function kitShippingEnabled(): Promise<boolean> {
  if (!hasAdminApiCredentials()) return false;
  try {
    const res = await adminGraphqlFetch<{ data?: { shop?: { metafield?: { value?: string } | null } } }>({
      query: `{ shop { metafield(namespace: "beepaws", key: "kit_shipping") { value } } }`,
      cache: "force-cache",
      tags: ["products"],
    });
    const raw = res.body.data?.shop?.metafield?.value;
    return raw ? sanitizeKitShipping(JSON.parse(raw)).enabled : false;
  } catch {
    return false;
  }
}

// ─── Cart (Storefront API) ───────────────────────────────────────────────────

type CartRead = {
  lines: { nodes: { cost: { totalAmount: { amount: string } }; merchandise: { requiresComponents?: boolean; product?: { tags?: string[] } } }[] };
  discountCodes: { code: string; applicable: boolean }[];
  attributes: { key: string; value: string | null }[];
};

async function readCart(cartId: string): Promise<CartRead | null> {
  const res = await shopifyFetch<{ data?: { cart?: CartRead | null } }>({
    cache: "no-store",
    query: `query kitShipCart($id: ID!) { cart(id: $id) {
      lines(first: 100) { nodes { cost { totalAmount { amount } } merchandise { ... on ProductVariant { requiresComponents product { tags } } } } }
      discountCodes { code applicable }
      attributes { key value } } }`,
    variables: { id: cartId },
  });
  return res.body.data?.cart ?? null;
}

async function setCartCodes(cartId: string, codes: string[]) {
  await shopifyFetch({
    cache: "no-store",
    query: `mutation kitShipCodes($id: ID!, $codes: [String!]) { cartDiscountCodesUpdate(cartId: $id, discountCodes: $codes) { userErrors { message } } }`,
    variables: { id: cartId, codes },
  });
}

/** cartAttributesUpdate replaces ALL attributes, so the others are written back. */
async function setCartRecord(cartId: string, attrs: CartRead["attributes"], record: KitRecord | null) {
  const rest = attrs.filter((a) => a.key !== ATTRIBUTE_KEY).map((a) => ({ key: a.key, value: a.value ?? "" }));
  const next = record ? [...rest, { key: ATTRIBUTE_KEY, value: JSON.stringify(record) }] : rest;
  await shopifyFetch({
    cache: "no-store",
    query: `mutation kitShipAttrs($id: ID!, $a: [AttributeInput!]!) { cartAttributesUpdate(cartId: $id, attributes: $a) { userErrors { message } } }`,
    variables: { id: cartId, a: next },
  });
}

// ─── Codes (Admin API) ───────────────────────────────────────────────────────

type KitRecord = { code: string; min: string; endsAt: string };

function newCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to misread
  const bytes = randomBytes(10);
  return KIT_SHIPPING_CODE_PREFIX + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Live kit codes: Shopify's count (fetched at most every 30s per server
 *  instance) PLUS the codes this instance made in the last 2 minutes. Shopify's
 *  search lags behind new discounts — measured 2026-10-15: right after making
 *  11, a search found 10 and a fresh count read low — so the count alone let
 *  the 11th through a cap of 10. Codes the index has already caught up on are
 *  counted twice for up to 2 minutes: the safe side for a cap. */
let liveCount: { at: number; n: number } | null = null;
const madeHere: number[] = [];
const INDEX_LAG_MS = 120_000;

async function liveCodes(): Promise<number> {
  const now = Date.now();
  while (madeHere.length && now - madeHere[0] > INDEX_LAG_MS) madeHere.shift();
  if (!liveCount || now - liveCount.at >= 30_000) {
    const res = await adminGraphqlFetch<{ data?: { discountNodesCount?: { count: number } } }>({
      query: `query kitShipLive($q: String!) { discountNodesCount(query: $q) { count } }`,
      variables: { q: `title:${KIT_SHIPPING_TITLE}* AND status:active` },
    });
    liveCount = { at: now, n: res.body.data?.discountNodesCount?.count ?? 0 };
  }
  return liveCount.n + madeHere.length;
}

/** Thrown when the store-wide cap is reached; the route treats it as "no code". */
export class KitShippingCapReached extends Error {}

async function createCode(min: string, config: KitShippingConfig): Promise<KitRecord> {
  if ((await liveCodes()) >= config.maxLiveCodes) {
    throw new KitShippingCapReached(`kit shipping: ${config.maxLiveCodes} live codes reached — no new code until some expire`);
  }
  const code = newCode();
  const now = Date.now();
  const endsAt = new Date(now + config.hours * 3600_000).toISOString();
  const res = await adminGraphqlFetch<{
    data?: { discountCodeFreeShippingCreate?: { codeDiscountNode?: { id: string } | null; userErrors?: { message: string }[] } };
  }>({
    query: `mutation kitShipCreate($d: DiscountCodeFreeShippingInput!) {
      discountCodeFreeShippingCreate(freeShippingCodeDiscount: $d) { codeDiscountNode { id } userErrors { message } } }`,
    variables: {
      d: {
        title: `${KIT_SHIPPING_TITLE} · ${code}`,
        code,
        startsAt: new Date(now - 60_000).toISOString(),
        endsAt,
        usageLimit: 1,
        context: { all: "ALL" },
        minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: min } },
        destination: { all: true },
        ...(config.maxShippingPrice > 0 ? { maximumShippingPrice: config.maxShippingPrice.toFixed(2) } : {}),
        combinesWith: { productDiscounts: true, orderDiscounts: true, shippingDiscounts: false },
      },
    },
  });
  const payload = res.body.data?.discountCodeFreeShippingCreate;
  if (!payload?.codeDiscountNode?.id) {
    throw new Error(`kit shipping code not created: ${payload?.userErrors?.map((e) => e.message).join("; ") || "no id"}`);
  }
  madeHere.push(Date.now());
  return { code, min, endsAt };
}

async function deleteCodes(codes: string[]) {
  for (const code of codes) {
    const found = await adminGraphqlFetch<{ data?: { codeDiscountNodeByCode?: { id: string } | null } }>({
      query: `query kitShipFind($c: String!) { codeDiscountNodeByCode(code: $c) { id } }`,
      variables: { c: code },
    });
    const id = found.body.data?.codeDiscountNodeByCode?.id;
    if (id) {
      await adminGraphqlFetch({
        query: `mutation kitShipDelete($id: ID!) { discountCodeDelete(id: $id) { userErrors { message } } }`,
        variables: { id },
      });
    }
  }
}

/** Deletes expired kit codes (25 at a time) — run after each new code, so the
 *  store's discount list never fills up with dead ones. Best effort. */
async function sweepExpired() {
  const res = await adminGraphqlFetch<{ data?: { discountNodes?: { nodes?: { id: string }[] } } }>({
    query: `query kitShipExpired($q: String!) { discountNodes(first: 25, query: $q) { nodes { id } } }`,
    variables: { q: `title:${KIT_SHIPPING_TITLE}* AND status:expired` },
  });
  for (const { id } of res.body.data?.discountNodes?.nodes ?? []) {
    await adminGraphqlFetch({
      query: `mutation kitShipDelete($id: ID!) { discountCodeDelete(id: $id) { userErrors { message } } }`,
      variables: { id },
    });
  }
}

// ─── The one entry point ─────────────────────────────────────────────────────

export type KitShippingState = { code: string; endsAt: string } | null;

/**
 * Makes the cart's kit shipping code right for what's in it now: attached when
 * it holds a kit (fresh if the kit total changed or the code is near expiry),
 * removed and deleted when it doesn't, nothing when the feature is off.
 * Returns the code on the cart, or null.
 */
export async function ensureKitShippingCode(cartId: string): Promise<KitShippingState> {
  if (!hasAdminApiCredentials()) return null;
  const [config, cart] = await Promise.all([readConfig(), readCart(cartId)]);
  if (!cart) return null;

  const ours = cart.discountCodes.filter((d) => d.code.toUpperCase().startsWith(KIT_SHIPPING_CODE_PREFIX));
  const others = cart.discountCodes.filter((d) => !ours.includes(d)).map((d) => d.code);
  const kitTotal = cart.lines.nodes
    .filter((l) => l.merchandise.requiresComponents || l.merchandise.product?.tags?.includes("bundle"))
    .reduce((sum, l) => sum + Number(l.cost.totalAmount.amount || 0), 0);

  // No kit (or switched off): take our codes off the cart and out of the store.
  if (!config.enabled || kitTotal <= 0) {
    if (ours.length) {
      await setCartCodes(cartId, others);
      await setCartRecord(cartId, cart.attributes, null);
      await deleteCodes(ours.map((d) => d.code));
    }
    return null;
  }

  const min = (Math.floor(kitTotal * (1 - config.promoAllowance / 100) * 100) / 100).toFixed(2);
  let record: KitRecord | null = null;
  try {
    record = JSON.parse(cart.attributes.find((a) => a.key === ATTRIBUTE_KEY)?.value ?? "null") as KitRecord | null;
  } catch {
    record = null;
  }
  const current =
    ours.length === 1 &&
    record?.code === ours[0].code &&
    record.min === min &&
    Date.parse(record.endsAt) - Date.now() > RENEW_WITHIN_MS;
  if (current && record) return { code: record.code, endsAt: record.endsAt };

  const fresh = await createCode(min, config);
  await setCartCodes(cartId, [...others, fresh.code]);
  await setCartRecord(cartId, cart.attributes, fresh);
  await deleteCodes(ours.map((d) => d.code)).catch(() => {});
  await sweepExpired().catch(() => {});
  return { code: fresh.code, endsAt: fresh.endsAt };
}
