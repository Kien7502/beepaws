/**
 * Create all `beepaws.*` metafield definitions in Shopify Admin AND keep
 * `scripts/products/_template.json` (an empty starter shape) in sync with
 * the schema. Idempotent — re-running is safe.
 *
 * Schema lives in `scripts/metafield-schemas.mjs` — adding/removing a
 * metafield is one edit there, then this script propagates to Shopify and
 * to the template. The template is what edit-product-content.mjs copies
 * from when creating a new product file, and what it backfills missing
 * keys from when the schema gains fields.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-metafield-definitions.mjs
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { METAFIELD_SCHEMAS, buildTemplate } from "./metafield-schemas.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, "products", "_template.json");

const API_VERSION =
  process.env.SHOPIFY_ADMIN_GRAPHQL_VERSION?.trim() ||
  process.env.SHOPIFY_ADMIN_API_VERSION?.trim() ||
  "2025-04";

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

  const id =
    process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim() || process.env.SHOPIFY_API_KEY?.trim();
  const secret =
    process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim() ||
    process.env.SHOPIFY_API_SECRET?.trim();

  if (!id || !secret) {
    throw new Error(
      "Set SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_ADMIN_CLIENT_ID+SECRET (or SHOPIFY_API_KEY+SECRET)",
    );
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
  try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON oauth response: ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`OAuth ${res.status}: ${data.error_description || data.error || text.slice(0, 200)}`);
  if (!data.access_token) throw new Error("OAuth response missing access_token");
  return data.access_token;
}

const MUTATION = `
  mutation CreateDef($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id namespace key name type { name } }
      userErrors { field message code }
    }
  }
`;

// Derive Shopify definitions from the central schema — single source of truth
// in metafield-schemas.mjs.
const DEFINITIONS = METAFIELD_SCHEMAS.map((s) => ({
  key: s.key,
  name: s.name,
  type: s.shopifyType,
}));

async function gql(token, query, variables) {
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
  try { body = JSON.parse(text); } catch { throw new Error(`Non-JSON gql response (HTTP ${res.status}): ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors).slice(0, 400)}`);
  return body.data;
}

console.log(`Shop:        ${shop}`);
console.log(`API version: ${API_VERSION}`);
console.log("Auth:        client_credentials (or static token if set)\n");

const token = await getAccessToken();
console.log("Got admin access token\n");

let created = 0;
let skipped = 0;
let failed = 0;

for (const def of DEFINITIONS) {
  const definition = {
    namespace: "beepaws",
    key: def.key,
    name: def.name,
    type: def.type,
    ownerType: "PRODUCT",
    access: { storefront: "PUBLIC_READ" },
  };

  process.stdout.write(`beepaws.${def.key.padEnd(22)} `);

  try {
    const data = await gql(token, MUTATION, { definition });
    const result = data.metafieldDefinitionCreate;
    const errs = result.userErrors ?? [];

    if (result.createdDefinition) {
      console.log(`OK    (${result.createdDefinition.id})`);
      created++;
      continue;
    }

    const taken = errs.find((e) => e.code === "TAKEN");
    if (taken) {
      console.log("SKIP  (already exists)");
      skipped++;
      continue;
    }

    console.log(`FAIL  ${JSON.stringify(errs)}`);
    failed++;
  } catch (e) {
    console.log(`ERROR ${e.message}`);
    failed++;
  }
}

console.log(`\nSummary: ${created} created, ${skipped} already existed, ${failed} failed`);

// Refresh the local template alongside the Shopify definitions — keeps the
// editable starter shape aligned with whatever's in METAFIELD_SCHEMAS.
await mkdir(dirname(TEMPLATE_PATH), { recursive: true });
await writeFile(TEMPLATE_PATH, JSON.stringify(buildTemplate(), null, 2));
console.log(`Template:   ${TEMPLATE_PATH}`);

process.exit(failed > 0 ? 1 : 0);
