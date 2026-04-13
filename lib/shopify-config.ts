/** Storefront API token — dùng cho `lib/shopify/index.ts` (Cart GraphQL). Catalog dùng GraphQL Admin trong `lib/shopify/queries.ts`. */
export function hasStorefrontCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim() &&
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim(),
  );
}

/** @deprecated Dùng hasStorefrontCredentials */
export function isShopifyConfigured(): boolean {
  return hasStorefrontCredentials();
}
