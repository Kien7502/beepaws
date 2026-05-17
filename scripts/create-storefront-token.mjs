/**
 * One-off: create a Storefront API access token via the Admin API.
 *
 * Why this exists: Shopify doesn't surface Storefront token creation in the
 * dev dashboard UI for CLI-managed custom apps. The Admin API can mint one
 * directly via `storefrontAccessTokenCreate`. The new token inherits the
 * `unauthenticated_*` scopes configured on the app.
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-storefront-token.mjs
 *
 * Output prints the token — copy it to .env.local as:
 *   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
 */

const API_VERSION =
  process.env.SHOPIFY_ADMIN_GRAPHQL_VERSION?.trim() ||
  process.env.SHOPIFY_ADMIN_API_VERSION?.trim() ||
  "2025-04";

const TOKEN_TITLE = process.argv[2]?.trim() || "BeePaws Web";

function normalizeHost(raw) {
  if (!raw?.trim()) throw new Error("Set SHOPIFY_SHOP_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN");
  const h = raw.trim().replace(/^https?:\/\//, "").split("/")[0]?.replace(/\/$/, "") ?? "";
  if (!h.endsWith(".myshopify.com")) {
    throw new Error(`Domain must be *.myshopify.com, got: ${h}`);
  }
  return h;
}

const shop = normalizeHost(
  process.env.SHOPIFY_SHOP_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim(),
);

async function getAccessToken() {
  const staticTok = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (staticTok) return staticTok;

  const id = process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim() || process.env.SHOPIFY_API_KEY?.trim();
  const secret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim() || process.env.SHOPIFY_API_SECRET?.trim();
  if (!id || !secret) {
    throw new Error("Set SHOPIFY_ADMIN_ACCESS_TOKEN or client_id + secret");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON oauth: ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`OAuth ${res.status}: ${data.error_description || data.error || text.slice(0, 200)}`);
  if (!data.access_token) throw new Error("No access_token in oauth response");
  return data.access_token;
}

const MUTATION = `
  mutation CreateStorefrontToken($input: StorefrontAccessTokenInput!) {
    storefrontAccessTokenCreate(input: $input) {
      storefrontAccessToken {
        accessToken
        title
        accessScopes { handle }
        createdAt
      }
      userErrors { field message }
    }
  }
`;

const LIST_QUERY = `
  query ListStorefrontTokens {
    shop {
      storefrontAccessTokens(first: 20) {
        edges {
          node {
            id
            title
            accessToken
            createdAt
            accessScopes { handle }
          }
        }
      }
    }
  }
`;

console.log(`Shop:   ${shop}`);
console.log(`API:    ${API_VERSION}`);
console.log(`Title:  "${TOKEN_TITLE}"\n`);

const token = await getAccessToken();
console.log("Got admin access token. Checking for existing Storefront tokens...\n");

async function gql(query, variables) {
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`Non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors).slice(0, 400)}`);
  return body.data;
}

// List existing tokens first — Shopify limits how many Storefront tokens an
// app can have, and re-using an existing one is usually what you want.
const existing = await gql(LIST_QUERY);
const tokens = existing.shop?.storefrontAccessTokens?.edges ?? [];
if (tokens.length > 0) {
  console.log(`Found ${tokens.length} existing Storefront token(s) for this app:`);
  for (const { node } of tokens) {
    console.log(`  - ${node.title} (created ${node.createdAt})`);
    console.log(`    token: ${node.accessToken}`);
    console.log(`    scopes: ${node.accessScopes.map((s) => s.handle).join(", ") || "(none)"}`);
  }
  console.log(`\nIf one of these has the scopes you need, copy its token to .env.local:`);
  console.log(`  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=<token>\n`);
  console.log(`Otherwise re-run with a different title to create a new one:`);
  console.log(`  node --env-file=.env.local scripts/create-storefront-token.mjs "Some New Title"\n`);
  process.exit(0);
}

console.log("No existing tokens. Creating a new one...\n");
const data = await gql(MUTATION, { input: { title: TOKEN_TITLE } });
const result = data.storefrontAccessTokenCreate;
if (result.userErrors?.length) {
  console.error("FAILED:", JSON.stringify(result.userErrors, null, 2));
  process.exit(1);
}

const t = result.storefrontAccessToken;
console.log("OK — created Storefront access token");
console.log(`  title:  ${t.title}`);
console.log(`  scopes: ${t.accessScopes.map((s) => s.handle).join(", ") || "(none)"}`);
console.log(`  token:  ${t.accessToken}\n`);
console.log("Add this to .env.local:");
console.log(`  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=${t.accessToken}\n`);
console.log("Then restart `npm run dev`.");
