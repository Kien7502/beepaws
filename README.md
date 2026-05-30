# BeePaws Storefront

Headless Shopify storefront for BeePaws. Built on Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript. Product content is split between Shopify (catalog, prices, variants, images) and `beepaws.*` metafields (marketing copy, FAQs, reviews, comparison tables, etc.).

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other commands:

```bash
npm run lint       # ESLint
npx tsc --noEmit   # type-check (primary correctness gate — no test suite)
```

### Running the production build locally

```bash
npm run build      # compile (webpack, ~10s)
npm start          # serve on http://localhost:3000
```

One-liner (PowerShell 5.1 — no `&&`):

```powershell
npm run build; if ($?) { npm start }
```

Stop the dev server first — both bind port 3000. If something stays bound after Ctrl+C, kill stray node processes:

```powershell
Get-Process -Name node | Stop-Process -Force
```

### Next.js version is pinned to 16.1.6

`package.json` pins `"next"` and `"eslint-config-next"` to `16.1.6` exact (no caret). Next 16.2.x has a Turbopack dev-mode regression where `window.location.href` redirects to Shopify checkout, then Back, leaves the page un-hydrated (CSS works, nothing clickable) — production was unaffected, but dev was unusable for checkout testing.

Don't bump Next.js without confirming the fix has shipped (test: add to cart → drawer → Checkout securely → Shopify → Back → drawer items still interactive). To bump deliberately: `npm install --save-exact next@<version> eslint-config-next@<version>`.

## Environment

Create `.env.local`:

```env
SHOPIFY_SHOP_DOMAIN=shop_name.myshopify.com
# Either a static token (custom app)
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx
# OR client credentials
SHOPIFY_ADMIN_CLIENT_ID=xxx
SHOPIFY_ADMIN_CLIENT_SECRET=xxx
```

Optional:

```env
SHOPIFY_ADMIN_API_VERSION=2025-04
NEXT_PUBLIC_SITE_URL=https://beepaws.com
```

## Architecture

Product pages are server-rendered at `app/products/[handle]/page.tsx`. Data flow:

1. `getFullProductForPage(handle)` calls Shopify Admin GraphQL, fetches the product plus all metafields in one query (`lib/shopify/admin-product-page.ts`)
2. `normalizeMetafields()` parses the `beepaws.*` namespace into a typed `BeepawsMetafields` object (`types/metafields.ts`)
3. Each section component accepts typed props with a `DEFAULT_*` fallback — if the metafield is null, the component renders sensible defaults

This means: a product page never breaks if a metafield is missing, and brand-level copy (stats, FAQs that apply to all products) can live in code instead of being copied into every product.

## Product page metafields

All in the `beepaws.*` namespace, owner type `PRODUCT`:

| Key | Type | Used by |
|---|---|---|
| `product_bullets` | `list.single_line_text_field` | Bullet checklist near buy button |
| `ingredients` | `list.single_line_text_field` | Ingredients chips in description accordion |
| `education_note` | `single_line_text_field` | Reserved for use near buy button |
| `tech_specs` | `json` | Specifications section in description accordion |
| `stats` | `json` | `StatsTrustBar` below the fold |
| `comparison_rows` | `json` | `ComparisonTable` below the fold |
| `use_cases` | `json` | `UseCaseCards` below the fold |
| `faq_items` | `json` | `FAQSection` below the fold |
| `reviews` | `json` | `UGCReviews` carousel below the fold |
| `before_after_slides` | `json` | `BeforeAfterSection` below the fold |
| `bundle_tiers` | `json` | Per-tier name + description overrides in VariantSelector. Shape: `[{name?, description?}]` — index 0 = Starter, 1 = Complete Care, 2 = Family Pack. Empty/missing entries fall back to defaults. |

JSON shapes are defined in `types/metafields.ts`. The single source of truth for the schema (Shopify type + editor shape) is [`scripts/metafield-schemas.mjs`](scripts/metafield-schemas.mjs) — see [`scripts/README.md`](scripts/README.md) for the full workflow including how to add a new metafield end-to-end.

## Adding content to a new product

Quick reference below. Full details, the schema entry shape, and the utility scripts (Storefront token, payment-methods diagnostic, OAuth test) live in [`scripts/README.md`](scripts/README.md).

### 1. One-time per shop — create metafield definitions

```bash
node --env-file=.env.local scripts/seed-metafield-definitions.mjs
```

Idempotent. Existing definitions report `SKIP`. New ones report `OK`.

### 2. Per product — author the content interactively

```bash
node --env-file=.env.local scripts/edit-product-content.mjs [product-handle]
```

Interactive CLI that reads/writes `scripts/products/<handle>.json`. Menu lets you add/edit/delete items in each list (FAQ, reviews, etc.) one field at a time — no JSON typing required. Auto-saves after every change.

- **No handle?** The script lists existing product files in `scripts/products/` so you can pick one, or `n` to create a new one.
- **Tags editor**: edit Shopify product tags inline. `s` queries `shop.productTags` so you can pick from the shop-wide pool instead of typing duplicates. New products default to `["device"]` so the PDP renders the device-template sections (Mechanism + SilentReassurance).
- **Push from inside the editor**: `p` from the main menu pushes metafields + tags directly — no separate seed command needed (skip step 3 below if you use this).
- `--env-file=.env.local` is only required for `s` (suggest tags) and `p` (push). Pure local editing works without it.

### 3. Push the content to Shopify

```bash
node --env-file=.env.local scripts/seed-product-metafields.mjs <product-handle>
```

If `scripts/products/<handle>.json` exists, that's the source. Otherwise the script falls back to built-in dental-scaler defaults (useful for first-time seeding before any JSON file exists). Tags come from `content.tags` in the JSON; if missing, defaults to `["device"]`. `productUpdate` replaces the full tag list — the local JSON is authoritative.

### 4. Fresh machine — pull existing product content from Shopify

```bash
node --env-file=.env.local scripts/pull-product-metafields.mjs <product-handle> [--force]
```

Reverse of step 3: fetches `beepaws.*` metafields + tags from Shopify and writes `scripts/products/<handle>.json`. Use when cloning the repo to a new machine, or when someone has edited a product directly in Shopify Admin and you want the local file to catch up. Refuses to overwrite an existing local file without `--force`.

### Alternative — Shopify Admin UI

Once the definitions are seeded (step 1), every product has a Metafields panel in the Shopify Admin. For text and list fields the UI is friendly; for `json` fields you have to paste valid JSON (which is what step 2 helps avoid).

Shopify's "Duplicate product" action copies metafields, so once one product is set up, duplicating it is the fastest way to start a similar product.

## Project layout

```
app/
  products/[handle]/page.tsx      Main product page
  globals.css                     Tailwind v4 theme + custom properties
components/
  product/                        Section components — each takes typed props
                                  with DEFAULT_* fallback
  layout/Footer.tsx
  ui/WaveDivider.tsx              Animated SVG section divider
lib/
  shopify/
    admin-graphql.ts              Admin API fetch helper (OAuth or static token)
    admin-credentials.ts          Token resolution + caching
    admin-product-page.ts         normalizeMetafields() — parses beepaws.* namespace
    queries.ts                    Public query functions
types/
  metafields.ts                   BeepawsMetafields and all typed interfaces
scripts/
  shopify-admin.mjs               Shared: auth, GraphQL, common product mutations
  metafield-schemas.mjs           Single source of truth for the beepaws.* schema
  seed-metafield-definitions.mjs  One-time: create beepaws.* definitions
  edit-product-content.mjs        Interactive editor (metafields + tags + push)
  seed-product-metafields.mjs     Push JSON content to Shopify (metafields + tags)
  pull-product-metafields.mjs     Pull metafields + tags FROM Shopify → local JSON
  products/                       Per-product content files (committed)
```

## Notes

- **Wave dividers between sections**: every divider has a 3px overlap (`marginTop: "-3px"`) on the following section to hide subpixel compositor gaps at non-100% zoom. Don't remove without testing at 90% / 110% zoom.
- **Product page root**: uses `style={{ overflowX: "clip" }}` not `overflow-clip` — the latter creates a hard vertical paint boundary that causes a visible seam under the footer wave.
- **Footer**: uses `marginTop: "-16px"` plus a cream gap-fill `background` so any compositor seam between the FAQ section and footer wave shows cream, not dark green.
