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

### Next.js version is pinned (exact)

`package.json` pins `"next"` and `"eslint-config-next"` exact (no caret) — **16.4.3** since 2026-10-26. It sat at 16.1.6 until 2026-10-10, which by October carried 35 security advisories (two critical); the bump to 16.4.0 cleared every runtime one. Then two new critical advisories + one high covered 16.0.0–16.4.0 (fixed in 16.4.1), and `next build` started stopping with a `SecurityFatalError` until upgraded → 16.4.3 (none of the three hit this code: no Server Actions, no `use cache`, sharp already ≥ 0.35.5). What `npm audit` still lists is lint tooling only (zod via eslint-plugin-react-hooks).

Why the pin exists: Next 16.2.x had a Turbopack dev-mode regression where the redirect to Shopify checkout, then Back, left the page un-hydrated (CSS works, nothing clickable). Production was never affected, but dev was unusable for checkout testing.

To bump deliberately: `npm install --save-exact next@<version> eslint-config-next@<version>`, then run the checkout → Back test (add to cart → drawer → Checkout securely → Shopify → Back → the page still responds). On 2026-10-10 that test was automated in headless Chrome 154 against `next dev`: 16.4.0 passed — but so did 16.2.0, so the original bug no longer reproduces there and a pass proves less than it used to. One more check by hand in your everyday browser is the real test. (16.4 sends dev pages `no-store`, so Back reloads them instead of restoring them from the back/forward cache.)

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

Product pages are server-rendered at `app/products/[handle]/page.tsx` (ISR: every product is
prerendered, `revalidate = 3600`, cache tag `products`). Data flow:

1. `getFullProductForPage(handle)` fetches the product plus all `beepaws.*` metafields in one Admin
   GraphQL query (`lib/shopify/admin-product-page.ts`).
2. `normalizeMetafields()` parses them into a typed `BeepawsMetafields` object (`types/metafields.ts`).
3. Each section component takes typed props with a `DEFAULT_*` fallback, so a missing metafield
   never breaks the page.

**Content is authored in the admin app** ([`../beepaws-admin`](../beepaws-admin)) — product copy,
the homepage blocks, listicles and the theme all go through its editor and are pushed to Shopify
from there. The `beepaws.*` schema's single source of truth is the admin's `lib/schema.ts`; this
repo only reads it. (The old `scripts/` content CLI was retired when the admin took over.)

- **Live refresh:** after a Push / Publish the admin calls `/api/revalidate` with a key derived from
  the shared Shopify client secret (`lib/revalidate-key.ts`) — there's no Shopify webhook for
  metafield content.
- **Draft previews** (dev only, `BEEPAWS_PREVIEW_ENABLED=1`): `/preview/products/[handle]`,
  `/preview/homepage` and `/preview/listicles/[id]` render the admin's unsaved draft
  (`?admin=<port>`), for the admin's preview pane.
- **Listicles:** `/journal/[slug]` renders admin-authored editorial pages
  (`lib/shopify/listicles.ts`, `components/journal/`) without the site header and footer.

Contracts between the two repos live in `docs/admin-handoff-*.md` and `docs/bundles-from-admin.md`;
the current state of each feature is in [`CLAUDE.md`](CLAUDE.md).

## Project layout

```
app/
  products/[handle]/      Product page (ISR)
  collections/            Catalog pages
  journal/[slug]/         Admin-authored listicles
  preview/                Draft previews for the admin tool (dev-gated)
  api/                    Cart / checkout routes, /api/revalidate
  globals.css             Tailwind v4 theme, Warm Honey tokens, print styles
components/
  product/                Product-page sections (typed props + DEFAULT_* fallbacks)
  home/                   Metafield-driven homepage (wired in via app/page.tsx later)
  journal/                Listicle view + floating button
  cart/ layout/ ui/       Cart drawer, header/footer, shared UI
lib/
  shopify/                Admin GraphQL fetch, catalog/product queries, cart, homepage,
                          listicles, variant groups, discounts
  inline-format.tsx       **bold** / ==highlight== / *italic* / [link](url) for authored copy
  content-icons.ts        Server-side lucide catalog for authored icon names
types/
  metafields.ts           BeepawsMetafields and the typed metafield shapes
docs/                     Admin ⇄ storefront contracts
```

## Notes

- **Wave dividers between sections**: every divider has a 3px overlap (`marginTop: "-3px"`) on the
  following section to hide subpixel compositor gaps at non-100% zoom. Don't remove without
  testing at 90% / 110% zoom.
- **Product page root**: uses `style={{ overflowX: "clip" }}` not `overflow-clip` — the latter
  creates a hard vertical paint boundary that causes a visible seam under the footer wave.
