# Scripts

CLI utilities for managing the Shopify side of BeePaws — metafield definitions, per-product content, payment methods, and Storefront API tokens. All scripts are plain Node ESM (`.mjs`) and read environment variables from `.env.local` via `node --env-file=`.

## Prerequisites

`.env.local` at the repo root must define:

```env
# One of these two — Admin auth (both scripts and the app server use this)
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
# OR
SHOPIFY_ADMIN_CLIENT_ID=...
SHOPIFY_ADMIN_CLIENT_SECRET=...

# Required
SHOPIFY_SHOP_DOMAIN=jzicqd-cd.myshopify.com
# (or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN — either works)

# Optional — defaults to the values shown
SHOPIFY_ADMIN_API_VERSION=2025-04
NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION=2025-10
```

## Metafield workflow

The product page content (FAQs, reviews, stats, comparison rows, bundle copy, etc.) lives in the `beepaws.*` Shopify metafield namespace. All three metafield scripts read their shape from one central schema file: [`metafield-schemas.mjs`](metafield-schemas.mjs). **Adding a new metafield is a one-file edit there** — the seed, editor, and push scripts pick it up automatically.

### 1. Seed definitions (per-shop, one-off + whenever the schema changes)

```bash
node --env-file=.env.local scripts/seed-metafield-definitions.mjs
```

What it does:
- Creates every entry in `METAFIELD_SCHEMAS` as a `beepaws.*` definition in Shopify Admin. Idempotent — existing definitions report `SKIP`, new ones report `OK`.
- Writes/updates [`products/_template.json`](products/_template.json) — a starter file with all current keys initialized to empty values. The editor uses this as the seed for new product files and to backfill missing keys in old ones.

Re-run this whenever you change `METAFIELD_SCHEMAS` (add a field, rename one, change a `name`).

### 2. Author content per product

```bash
node scripts/edit-product-content.mjs <product-handle>
```

Interactive menu — add/edit/delete items in each list field one prompt at a time, no JSON typing required. Reads from `scripts/products/<handle>.json` (or creates it from `_template.json` on first run). Auto-saves after every change.

If the schema gained new fields since you last edited this product, the editor backfills them with empty values and prints a list of what was added.

### 3. Push to Shopify

```bash
node --env-file=.env.local scripts/seed-product-metafields.mjs <product-handle>
```

Reads `scripts/products/<handle>.json` and calls `metafieldsSet` once with all fields present. Only keys that exist in the JSON are pushed — a partial file updates a subset without clobbering the rest.

If no per-product JSON exists, falls back to the built-in dental-scaler defaults (useful for first-time seeding of the flagship product).

## Adding a new metafield — concrete example

Say you want to add `warranty_terms` (a single text field shown near the buy button).

1. Open [`metafield-schemas.mjs`](metafield-schemas.mjs) and add an entry:

   ```js
   {
     key: "warranty_terms",
     name: "Warranty Terms",
     shopifyType: "single_line_text_field",
     kind: "text",
     label: "Warranty terms",
   },
   ```

2. Run the seed:

   ```bash
   node --env-file=.env.local scripts/seed-metafield-definitions.mjs
   ```

   This creates the `beepaws.warranty_terms` definition in Shopify and adds `"warranty_terms": ""` to `products/_template.json`.

3. Author content:

   ```bash
   node scripts/edit-product-content.mjs ultrasonic-pet-dental-scaler
   ```

   The new field shows up in the menu. Existing entries get the empty value backfilled automatically.

4. Push:

   ```bash
   node --env-file=.env.local scripts/seed-product-metafields.mjs ultrasonic-pet-dental-scaler
   ```

5. (App side, separate from these scripts) — add the field to `types/metafields.ts`, parse it in `lib/shopify/admin-product-page.ts`, and render it in the relevant component.

### Schema entry shape

| Field | Required | Notes |
|---|---|---|
| `key` | yes | Metafield key (no `beepaws.` prefix) |
| `name` | yes | Shown in the Shopify Admin UI |
| `shopifyType` | yes | `"single_line_text_field"` · `"list.single_line_text_field"` · `"json"` |
| `kind` | yes | Editor handling: `"text"` · `"list_of_strings"` · `"list_of_objects"` |
| `label` | yes | Short label for the editor menu |
| `itemFields` | only `list_of_objects` | Per-item field specs: `{ key, label, type?, default? }` |
| `summary` | only `list_of_objects` | Function `(item) => string` for the editor menu preview |

`itemFields` types: `"boolean"` · `"number"` · `"nullable_string"` · undefined (string). `default` provides the value used when the user presses Enter without typing.

## Utility scripts

### `create-storefront-token.mjs`

```bash
node --env-file=.env.local scripts/create-storefront-token.mjs
```

Mints a Storefront API access token via the Admin API. Needed because Shopify's dev dashboard UI doesn't expose Storefront token creation for CLI-managed custom apps. Output is the raw token — copy it into `.env.local` as `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`.

The new token inherits whatever `unauthenticated_*` scopes the app has configured (see `shopify.app.toml`).

### `check-payment-methods.mjs`

```bash
node --env-file=.env.local scripts/check-payment-methods.mjs
```

Diagnostic — prints exactly what Shopify returns for `shop.paymentSettings` (wallets + supported card brands). Hits the same APIs the app does, so the output matches what `PaymentMethodsRow` and `ShopPayButton` see. Useful when a payment badge isn't showing up and you need to confirm whether Shopify is reporting it.

### `test-shopify-oauth.mjs`

```bash
node --env-file=.env.local scripts/test-shopify-oauth.mjs
```

Smoke-tests the Admin OAuth client-credentials flow — same code path as `lib/shopify/admin-credentials.ts`. Run this when the app gets `401` errors from Shopify Admin to confirm whether the credentials themselves are working.

## Layout

```
scripts/
├── README.md                       (this file)
├── metafield-schemas.mjs           SINGLE SOURCE OF TRUTH for metafields
├── seed-metafield-definitions.mjs  Creates Shopify defs + maintains _template.json
├── edit-product-content.mjs        Interactive editor for per-product content
├── seed-product-metafields.mjs     Pushes per-product JSON to Shopify
├── create-storefront-token.mjs     Mints a Storefront API access token
├── check-payment-methods.mjs       Diagnostic: what Shopify reports for payments
├── test-shopify-oauth.mjs          Diagnostic: Admin OAuth credentials
└── products/
    ├── _template.json              Auto-generated empty starter (do not hand-edit)
    └── <handle>.json               Per-product content files (committed)
```
