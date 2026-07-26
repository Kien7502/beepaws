# CLAUDE.md — BeePaws Storefront

Guidance for Claude Code in this repository. This file holds **durable** facts only; session state (branch progress, pending decisions, experiment status) lives in auto-memory — read `project_beepaws_state.md` / `experiment_skill_redesign.md` there before starting work, and update them when state changes.

## Commands

```bash
npm run dev       # dev server (localhost:3000)
npm run build     # next build --webpack  (webpack forced for Next 16 compat)
npm run start     # serve production build
npm run lint      # eslint (eslint-config-next flat config)
npx tsc --noEmit  # type-check without emitting
```

No test framework exists. **`npx tsc --noEmit` and `npm run build` are the correctness gates before any commit.**

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Lucide icons · next-themes.

## Architecture

### Data layer — Shopify Admin GraphQL API (server-only)

All catalog data flows through the **Admin API** (not the Storefront API) because it avoids the `published_status` restriction:

```
Server Component → lib/shopify/queries.ts → admin-catalog.ts → admin-graphql.ts
                                          → POST /admin/api/2025-04/graphql.json
```

| File | Role |
|---|---|
| `lib/shopify/queries.ts` | public façade: `getProducts`, `getProduct`, `getCollections`, `getFullProductForPage` |
| `lib/shopify/admin-catalog.ts` | GraphQL query strings + mapping to `types/shopify.ts` shapes |
| `lib/shopify/admin-graphql.ts` | low-level fetch with `X-Shopify-Access-Token`; defaults `cache: "no-store"`, callers opt into `force-cache` + `tags: ["products"]` |
| `lib/shopify/admin-credentials.ts` | token from `SHOPIFY_ADMIN_ACCESS_TOKEN` or client-credentials OAuth (cached in memory) |
| `lib/shopify/admin-product-page.ts` | rich PDP metafield data (the `beepaws.*` content schema) |
| `lib/shopify/bundle-contents.ts` | resolves a Shopify bundle's components/variants (bundle PDP + inline tier picker) |
| `lib/shopify/draft-preview.ts` | admin-tool draft preview: `fetchAdminDraft` + `beepawsFromDraft` |
| `lib/shopify/mutations.ts` + `cart-client.ts` | Storefront Cart API, browser-safe (`NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`) |
| `lib/shopify/storefront-cart.ts` | server-side fresh-cart creation for checkout (`createCartWithLines`) |
| `lib/shopify/domain.ts` | `normalizeStorefrontApiHost` — requires the `.myshopify.com` host, throws on custom domains |

### Cart — two layers

1. `components/cart/CartProvider.tsx` — app-wide React context. Syncs to the Shopify Storefront Cart API when `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set; otherwise falls back to `localStorage` (`beepaws_local_cart_v1`). Exposes `drawerOpen / openDrawer / closeDrawer`.
2. `components/cart/CartDrawer.tsx` — right-edge slide panel, rendered once in `app/layout.tsx`. Quantity updates are debounced 600 ms before hitting the API.

`addItem()` is always optimistic: local state updates immediately, then the Shopify call reconciles.

### Caching / revalidation

Catalog queries use `cache: "force-cache"` + `next: { tags: ["products"] }`. The webhook at `app/api/revalidate/route.ts` verifies the Shopify HMAC then calls `revalidateTag`. Pages declare `export const revalidate = 3600` as ISR fallback; pages still on `force-dynamic` bypass all caching.

### Checkout

Two paths, both meaning "check out exactly these lines":
1. Cart drawer uses `cart.checkoutUrl` from the synced Storefront cart directly when available; otherwise it POSTs all items to `app/api/shopify/cart/checkout/route.ts`.
2. PDP "Buy It Now" (`VariantSelector`) POSTs its lines to the same route.

The route always creates a **fresh** Shopify cart via `createCartWithLines` and returns its `checkoutUrl`. Never reintroduce a persistent server-side cart with line merging — the old cookie-cart merge flow made every buy-now stack onto up to 14 days of earlier lines at checkout (bug fixed 2026-07-18); the route deletes the legacy `shopify_storefront_cart_id` cookie on each hit.

### Post-purchase return (`/thank-you`)

Shopify's Storefront Cart API has **no return-URL parameter and no `completedAt` field** — confirmed against shopify.dev and the Shopify dev community, not an oversight in this repo. A completed cart's id keeps resolving with its old lines forever. Full writeup, including the merchant-side action needed to actually trigger a redirect: `docs/post-purchase-return.md`.

What this repo does instead: `createCart`/`createCartWithLines` stamp a `return_url` cart **attribute** (a real `CartInput` field) at `${NEXT_PUBLIC_SITE_URL}/thank-you` via `buildReturnAttributes()` in `lib/shopify/mutations.ts`. The `/thank-you` route (`components/checkout/ThankYouContent.tsx`) clears the cart via `clearCart()` and records the cart id as completed (`markCartCompleted`, `CartProvider.tsx`) in a small localStorage ledger (`beepaws_completed_cart_ids`) that the hydration/restore path checks before ever re-presenting a cart — since Shopify itself won't tell us a cart was already used. Never add `completedAt` to the `CartFields` fragment; it's not a valid field on `Cart` and breaks every cart query.

### Bundles

Real Shopify bundles (created by the sibling admin tool, always tagged `bundle`): they are hidden from collection listings; a bundle's own PDP renders a "What's included" section from `lib/shopify/bundle-contents.ts`; a regular product's pricing tier can link a bundle via `beepaws.bundle_tiers[i].bundle`, which drives an inline bundle picker in `VariantSelector` (Add/Buy adds the chosen bundle variant). Contract doc: `docs/bundles-from-admin.md`.

### Admin draft preview

`app/preview/products/[handle]/page.tsx` (guarded, `force-dynamic`) renders the shared `components/product/ProductPageView.tsx` with the `beepaws.*` content (+ tags) overridden by a live draft fetched server-side from the admin tool at `BEEPAWS_ADMIN_URL` (default `http://localhost:3000`); price/images/variants stay from Shopify. Spec: `docs/admin-draft-preview-plan.md`.

### Design tokens

All colors and shadows are CSS variables in `app/globals.css` under `@theme inline` (Tailwind v4 syntax). Use `var(--color-primary)` etc. in classes — never hardcoded hex. Dark mode via next-themes, class strategy.

### Key types

`types/shopify.ts` defines `Product`, `ProductVariant`, `Collection`, `Image`, `Money` — all catalog components use these shapes.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Yes | `*.myshopify.com` — hostname for both Admin and Storefront APIs |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Yes* | `shpat_…` static admin token (server-only) |
| `SHOPIFY_ADMIN_CLIENT_ID` + `SHOPIFY_ADMIN_CLIENT_SECRET` | Yes* | Alternative OAuth client credentials |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Optional | Enables live Shopify cart sync + drawer checkout URL |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical URL base for SEO metadata / og:url |
| `NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL` | Optional | Custom storefront domain for cart-permalink fallback |
| `SHOPIFY_WEBHOOK_SECRET` | Optional | HMAC secret for the `/api/revalidate` webhook |
| `REVALIDATE_SECRET` | Optional | Token for manual `POST /api/revalidate?secret=…` |
| `BEEPAWS_ADMIN_URL` | Optional | Admin tool base URL for the draft-preview route (default `:3000`) |

\* One of the two admin credential options is required for the catalog to work.

`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` must be the `.myshopify.com` host, not the public storefront domain — `lib/shopify/domain.ts` throws otherwise.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
