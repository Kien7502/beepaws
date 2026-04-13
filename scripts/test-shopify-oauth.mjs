/**
 * One-off: POST client_credentials to Shopify (same as lib/shopify/admin-credentials.ts).
 * Usage: node --env-file=.env.local scripts/test-shopify-oauth.mjs
 */
function normalizeHost(raw) {
  if (!raw?.trim()) throw new Error("Set SHOPIFY_SHOP_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN");
  const h = raw
    .trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.replace(/\/$/, "") ?? "";
  if (!h.endsWith(".myshopify.com")) {
    throw new Error(`Domain must be *.myshopify.com, got: ${h}`);
  }
  return h;
}

const id =
  process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim() || process.env.SHOPIFY_API_KEY?.trim();
const secret =
  process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim() ||
  process.env.SHOPIFY_API_SECRET?.trim();
const shop = normalizeHost(
  process.env.SHOPIFY_SHOP_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim(),
);

if (!id || !secret) {
  console.error("Missing SHOPIFY_ADMIN_CLIENT_ID+SECRET or SHOPIFY_API_KEY+SECRET");
  process.exit(1);
}

if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim()) {
  console.warn(
    "Note: SHOPIFY_ADMIN_ACCESS_TOKEN is set — app runtime prefers this over OAuth.",
  );
}

const body = new URLSearchParams({
  grant_type: "client_credentials",
  client_id: id,
  client_secret: secret,
});

const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  },
  body: body.toString(),
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Non-JSON response:", text.slice(0, 500));
  process.exit(1);
}

if (!res.ok) {
  console.error("HTTP", res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

const t = data.access_token;
if (!t) {
  console.error("No access_token:", data);
  process.exit(1);
}

const mask =
  t.length > 12 ? `${t.slice(0, 8)}…${t.slice(-4)}` : "(token too short to mask)";
console.log("OK — client_credentials succeeded");
console.log("  shop:", shop);
console.log("  access_token:", mask, `(length ${t.length})`);
if (data.expires_in != null) console.log("  expires_in:", data.expires_in, "s");
