/**
 * Storefront GraphQL only accepts the permanent shop host `*.myshopify.com`.
 * Your Next.js site on a VPS/custom domain is separate; do not use that host for API calls.
 */
export function normalizeStorefrontApiHost(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  const h =
    raw
      .trim()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.replace(/\/$/, "") ?? "";
  if (!h) return "";
  if (!h.endsWith(".myshopify.com")) {
    throw new Error(
      "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN must be your-store.myshopify.com (Shopify Admin → Settings → Domains). It is not your VPS or public storefront domain. For cart/checkout links on a custom domain, set NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL.",
    );
  }
  return h;
}

/**
 * Public origin for cart permalinks and storefront links.
 * Prefer NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL when the online store uses a custom primary domain.
 */
export function getOnlineStoreOrigin(): string {
  const custom = process.env.NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL?.trim();
  if (custom) {
    const u = custom.replace(/\/$/, "");
    return u.startsWith("http") ? u : `https://${u}`;
  }
  const raw = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim();
  if (!raw) return "";
  const host = raw
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/\/$/, "");
  if (!host) return "";
  return `https://${host}`;
}

/** Hosted Online Store cart URL (Shopify checkout starts from here). */
export function getHostedStoreCartUrl(): string | null {
  const origin = getOnlineStoreOrigin();
  if (!origin) return null;
  return `${origin.replace(/\/$/, "")}/cart`;
}
