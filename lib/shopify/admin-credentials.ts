import "server-only";

import { normalizeStorefrontApiHost } from "./domain";

/**
 * Admin GraphQL / REST — server-only.
 * - `SHOPIFY_ADMIN_ACCESS_TOKEN` (shpat_…), hoặc
 * - `SHOPIFY_ADMIN_CLIENT_ID` + `SHOPIFY_ADMIN_CLIENT_SECRET` (hoặc `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET`).
 */

function adminClientId(): string | undefined {
  return (
    process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim() ||
    process.env.SHOPIFY_API_KEY?.trim()
  );
}

function adminClientSecret(): string | undefined {
  return (
    process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim() ||
    process.env.SHOPIFY_API_SECRET?.trim()
  );
}

function adminShopHost(): string {
  const raw =
    process.env.SHOPIFY_SHOP_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim();
  return normalizeStorefrontApiHost(raw);
}

export function hasAdminApiCredentials(): boolean {
  const raw =
    process.env.SHOPIFY_SHOP_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim();
  if (!raw) return false;
  try {
    normalizeStorefrontApiHost(raw);
  } catch {
    return false;
  }

  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim()) return true;

  const id = adminClientId();
  const secret = adminClientSecret();
  return Boolean(id && secret);
}

type ClientCredentialsResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

let cachedToken: { value: string; expiresAtMs: number } | null = null;
const TOKEN_REFRESH_SKEW_MS = 60_000;

async function fetchClientCredentialsAccessToken(): Promise<string> {
  const clientId = adminClientId();
  const clientSecret = adminClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Set SHOPIFY_ADMIN_ACCESS_TOKEN or client id + secret (SHOPIFY_ADMIN_CLIENT_ID + SHOPIFY_ADMIN_CLIENT_SECRET or SHOPIFY_API_KEY + SHOPIFY_API_SECRET)",
    );
  }

  const host = adminShopHost();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`https://${host}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const rawText = await res.text();
  let data: ClientCredentialsResponse = {};
  try {
    data = JSON.parse(rawText) as ClientCredentialsResponse;
  } catch {
    /* non-JSON */
  }

  if (!res.ok) {
    const msg =
      data.error_description ||
      data.error ||
      rawText.slice(0, 300) ||
      res.statusText;
    throw new Error(`Shopify OAuth access_token failed (${res.status}): ${msg}`);
  }

  const token = data.access_token?.trim();
  if (!token) {
    throw new Error("Shopify OAuth response missing access_token");
  }

  const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 86399;
  cachedToken = {
    value: token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  };

  return token;
}

export async function getAdminAccessToken(): Promise<string> {
  const staticToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (staticToken) return staticToken;

  const now = Date.now();
  if (
    cachedToken &&
    cachedToken.expiresAtMs - TOKEN_REFRESH_SKEW_MS > now
  ) {
    return cachedToken.value;
  }

  return fetchClientCredentialsAccessToken();
}
