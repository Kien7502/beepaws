/**
 * Quick diagnostic — prints exactly what Shopify returns for payment methods.
 * Hits the same APIs the app does so the output matches what the badge row sees.
 *
 * Usage:
 *   node --env-file=.env.local scripts/check-payment-methods.mjs
 */

const API_VERSION =
  process.env.SHOPIFY_ADMIN_GRAPHQL_VERSION?.trim() ||
  process.env.SHOPIFY_ADMIN_API_VERSION?.trim() ||
  "2025-04";

const STOREFRONT_API_VERSION =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2025-10";

function normalizeHost(raw) {
  if (!raw?.trim()) throw new Error("Set SHOPIFY_SHOP_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN");
  const h = raw.trim().replace(/^https?:\/\//, "").split("/")[0]?.replace(/\/$/, "") ?? "";
  if (!h.endsWith(".myshopify.com")) {
    throw new Error(`Domain must be *.myshopify.com, got: ${h}`);
  }
  return h;
}

const adminShop = normalizeHost(
  process.env.SHOPIFY_SHOP_DOMAIN?.trim() || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim(),
);
const storefrontShop = normalizeHost(
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim() || process.env.SHOPIFY_SHOP_DOMAIN?.trim(),
);

async function getAdminAccessToken() {
  const staticTok = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (staticTok) return staticTok;
  const id = process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim() || process.env.SHOPIFY_API_KEY?.trim();
  const secret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim() || process.env.SHOPIFY_API_SECRET?.trim();
  if (!id || !secret) throw new Error("No admin credentials set");

  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret });
  const res = await fetch(`https://${adminShop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth ${res.status}: ${data.error_description || data.error}`);
  return data.access_token;
}

console.log(`Admin shop:      ${adminShop}`);
console.log(`Storefront shop: ${storefrontShop}`);
console.log(`Admin API:       ${API_VERSION}`);
console.log(`Storefront API:  ${STOREFRONT_API_VERSION}\n`);

// ── Admin: digital wallets ────────────────────────────────────────────────
console.log("Querying Admin API → shop.paymentSettings.supportedDigitalWallets ...");
try {
  const adminToken = await getAdminAccessToken();
  const res = await fetch(`https://${adminShop}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken },
    body: JSON.stringify({
      query: `query { shop { paymentSettings { supportedDigitalWallets } } }`,
    }),
  });
  const body = await res.json();
  if (body.errors) {
    console.log(`  ERROR: ${JSON.stringify(body.errors)}`);
  } else {
    const wallets = body.data?.shop?.paymentSettings?.supportedDigitalWallets ?? [];
    console.log(`  wallets: [${wallets.join(", ") || "(empty)"}]`);
  }
} catch (e) {
  console.log(`  FAILED: ${e.message}`);
}

console.log();

// ── Storefront: accepted card brands ──────────────────────────────────────
console.log("Querying Storefront API → shop.paymentSettings.acceptedCardBrands ...");
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
if (!storefrontToken) {
  console.log("  SKIPPED: NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN not set");
} else {
  try {
    const res = await fetch(`https://${storefrontShop}/api/${STOREFRONT_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({
        query: `query { shop { paymentSettings { acceptedCardBrands } } }`,
      }),
    });
    const body = await res.json();
    if (body.errors) {
      console.log(`  ERROR: ${JSON.stringify(body.errors)}`);
    } else {
      const cards = body.data?.shop?.paymentSettings?.acceptedCardBrands ?? [];
      console.log(`  cards: [${cards.join(", ") || "(empty)"}]`);
    }
  } catch (e) {
    console.log(`  FAILED: ${e.message}`);
  }
}

console.log("\nReference — values our badge row knows how to render:");
console.log("  cards:   VISA, MASTERCARD, AMERICAN_EXPRESS, DISCOVER, DINERS_CLUB, JCB");
console.log("  wallets: APPLE_PAY, GOOGLE_PAY, ANDROID_PAY, SHOP_PAY, SHOPIFY_PAY, PAYPAL, AMAZON_PAY, FACEBOOK_PAY");
console.log("\nIf Shopify returns values not in this list, the badge row will skip them silently.");
