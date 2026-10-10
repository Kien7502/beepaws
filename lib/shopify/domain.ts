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
