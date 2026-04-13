import { ShopifyFetchParams } from "@/types/shopify";
import { normalizeStorefrontApiHost } from "./domain";

const apiVersion =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2025-10";
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
    const host = normalizeStorefrontApiHost(
      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
    );
    if (!host || !key?.trim()) {
      throw new Error(
        "Shopify env missing: set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN (your-store.myshopify.com) and NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN",
      );
    }

    const endpoint = `https://${host}/api/${apiVersion}/graphql.json`;

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

    const body = (await result.json()) as {
      errors?: {
        message?: string;
        extensions?: { code?: string };
      }[];
      data?: unknown;
    };

    if (!result.ok) {
      throw new Error(
        `Shopify HTTP ${result.status} for ${host}. Check Storefront token and API version.`,
      );
    }

    if (body.errors?.length) {
      const first = body.errors[0];
      const code = first?.extensions?.code;
      if (code === "UNAUTHORIZED" || code === "ACCESS_DENIED") {
        const hint =
          key.trim().startsWith("shpat_")
            ? " You pasted an Admin API token (shpat_). Storefront needs the separate Storefront API access token from the same app."
            : " Regenerate the Storefront access token in Shopify Admin (Headless channel or custom app) and ensure NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is exactly that shop's *.myshopify.com host.";
        throw new Error(`Storefront API ${code || "error"}:${hint}`);
      }
      const msg = first?.message || JSON.stringify(first);
      throw new Error(
        typeof msg === "string" ? msg : `Shopify GraphQL: ${JSON.stringify(first)}`,
      );
    }

    return {
      status: result.status,
      body: body as T,
    };
  } catch (e) {
    console.error("Error fetching from Shopify:", e);
    throw {
      error: e,
      query,
    };
  }
}
