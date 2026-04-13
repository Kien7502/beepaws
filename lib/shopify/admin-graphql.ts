import "server-only";

import type { ShopifyFetchParams } from "@/types/shopify";
import { getAdminAccessToken } from "./admin-credentials";
import { normalizeStorefrontApiHost } from "./domain";

const apiVersion =
  process.env.SHOPIFY_ADMIN_GRAPHQL_VERSION?.trim() ||
  process.env.SHOPIFY_ADMIN_API_VERSION?.trim() ||
  "2025-04";

/**
 * POST `https://{shop}/admin/api/{version}/graphql.json` với `X-Shopify-Access-Token`.
 */
export async function adminGraphqlFetch<T>({
  cache = "no-store",
  headers,
  query,
  tags,
  variables,
}: ShopifyFetchParams & { headers?: HeadersInit }): Promise<
  { status: number; body: T } | never
> {
  const raw =
    process.env.SHOPIFY_SHOP_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim();
  const host = normalizeStorefrontApiHost(raw);
  if (!host) {
    throw new Error(
      "Set SHOPIFY_SHOP_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN (your-store.myshopify.com)",
    );
  }

  const token = await getAdminAccessToken();
  const endpoint = `https://${host}/admin/api/${apiVersion}/graphql.json`;

  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
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
      errors?: { message?: string; extensions?: { code?: string } }[];
      data?: unknown;
    };

    if (!result.ok) {
      throw new Error(
        `Admin GraphQL HTTP ${result.status} for ${host}. Check SHOPIFY_ADMIN_ACCESS_TOKEN and API scopes.`,
      );
    }

    if (body.errors?.length) {
      const first = body.errors[0];
      const msg = first?.message || JSON.stringify(first);
      throw new Error(
        typeof msg === "string" ? msg : `Admin GraphQL: ${JSON.stringify(first)}`,
      );
    }

    return {
      status: result.status,
      body: body as T,
    };
  } catch (e) {
    console.error("Admin GraphQL error:", e);
    throw {
      error: e,
      query,
    };
  }
}
