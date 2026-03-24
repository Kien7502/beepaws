import { ShopifyFetchParams } from "@/types/shopify";

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const endpoint = `https://${domain}/api/2024-01/graphql.json`;
const key = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

export async function shopifyFetch<T>({
  cache = "force-cache",
  headers,
  query,
  tags,
  variables,
}: ShopifyFetchParams & { headers?: HeadersInit }): Promise<
  { status: number; body: T } | never
> {
  try {
    if (!domain || !key) {
      throw new Error("Shopify Environment variables are not set");
    }

    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": key,
        ...headers,
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables }),
      }),
      cache,
      ...(tags && { next: { tags } }),
    });

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body,
    };
  } catch (e) {
    console.error("Error fetching from Shopify:", e);
    throw {
      error: e,
      query,
    };
  }
}
