/**
 * One-off: create the 9 beepaws.* metafield definitions in Shopify Admin.
 * Idempotent — re-running is safe (existing definitions report TAKEN and are skipped).
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-metafield-definitions.mjs
 */

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

// All 9 definitions per v5 plan Section 7
const DEFINITIONS = [
  { key: "product_bullets",     name: "Product Bullet Points",   type: "list.single_line_text_field" },
  { key: "ingredients",         name: "Ingredients",             type: "list.single_line_text_field" },
  { key: "education_note",      name: "Education Note",          type: "single_line_text_field" },
  { key: "tagline",             name: "Card Tagline",            type: "single_line_text_field" },
  { key: "tech_specs",          name: "Tech Specifications",     type: "json" },
  { key: "comparison_rows",     name: "Comparison Table Rows",   type: "json" },
  { key: "use_cases",           name: "Use Case Cards",          type: "json" },
  { key: "faq_items",           name: "FAQ Items",               type: "json" },
  { key: "reviews",             name: "Customer Reviews",        type: "json" },
  { key: "stats",               name: "Stats Trust Bar",         type: "json" },
  { key: "before_after_slides", name: "Before After Slides",     type: "json" },
];

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
process.exit(failed > 0 ? 1 : 0);
