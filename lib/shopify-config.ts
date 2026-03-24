/**
 * Returns true when Storefront API env vars are set (real Shopify fetch).
 */
export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim() &&
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim(),
  );
}

/** Force demo catalog even when env vars exist (e.g. local preview). */
export function useMockShopData(): boolean {
  return process.env.NEXT_PUBLIC_SHOPIFY_USE_MOCK === "true";
}
