# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # start dev server (localhost:3000)
yarn build        # next build --webpack  (webpack forced for Next 16 compat)
yarn start        # serve production build
yarn lint         # eslint via eslint-config-next
npx tsc --noEmit  # type-check without emitting (no test suite exists)
```

No test framework is configured. Use `npx tsc --noEmit` as the primary correctness gate before committing.

## Architecture

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Lucide icons · next-themes

### Data layer — Shopify Admin GraphQL API (server-only)

All catalog data flows through the **Admin API** (not Storefront API) because it avoids the `published_status` restriction:

```
Server Component → lib/shopify/queries.ts → lib/shopify/admin-catalog.ts
                                          → lib/shopify/admin-graphql.ts
                                          → POST /admin/api/2025-04/graphql.json
```

- `lib/shopify/queries.ts` — public façade: `getProducts`, `getProduct`, `getCollections`, `getFullProductForPage`
- `lib/shopify/admin-catalog.ts` — GraphQL query strings + response mapping to `types/shopify.ts` shapes
- `lib/shopify/admin-graphql.ts` — low-level fetch with `X-Shopify-Access-Token`; defaults `cache: "no-store"`, callers can override with `cache: "force-cache"` + `tags: ["products"]` for ISR
- `lib/shopify/admin-credentials.ts` — resolves token from `SHOPIFY_ADMIN_ACCESS_TOKEN` or client-credentials OAuth flow (cached in memory)
- `lib/shopify/admin-product-page.ts` — fetches rich metafield data for PDP (specs, care instructions, etc.)
- `lib/shopify/mutations.ts` — GraphQL strings for Storefront Cart API (client-side cart)
- `lib/shopify/cart-client.ts` — browser-safe Storefront Cart calls using `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`

### Cart — two-layer design

1. **`components/cart/CartProvider.tsx`** — React context wrapping the whole app. Holds cart state, syncs to Shopify Storefront Cart API when `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` is set. Falls back to `localStorage` (`beepaws_local_cart_v1`) when Storefront API is unconfigured. Exposes `drawerOpen / openDrawer / closeDrawer` for the slide drawer.
2. **`components/cart/CartDrawer.tsx`** — fixed slide-in panel (right edge). Rendered once in `app/layout.tsx` inside `CartProvider`. Quantity updates are debounced 600 ms before hitting the API.

`addItem()` is always optimistic: local state updates immediately, then Shopify API call reconciles.

### Caching / revalidation

Catalog queries use `cache: "force-cache"` + `next: { tags: ["products"] }`. The webhook at `app/api/revalidate/route.ts` verifies Shopify HMAC then calls `revalidateTag("products", "max")`. Pages use `export const revalidate = 3600` as ISR fallback.

Pages that still use `force-dynamic` bypass all caching.

### Checkout flow

Client collects items in local/Shopify cart → `components/checkout/CheckoutClient.tsx` POSTs to `app/api/shopify/cart/checkout/route.ts` → server creates/merges Shopify cart via `lib/shopify/storefront-cart.ts` → returns `checkoutUrl` → `window.location.href = checkoutUrl`. Cart drawer's checkout button uses `cart.checkoutUrl` directly when Storefront API is live.

### Design tokens

All colors and shadows are CSS variables defined in `app/globals.css` under `@theme inline` (Tailwind v4 syntax). Use `var(--color-primary)` etc. in Tailwind classes, not hardcoded hex values. Dark mode via `next-themes` with class strategy.

### Key types

`types/shopify.ts` defines `Product`, `ProductVariant`, `Collection`, `Image`, `Money` — all catalog components reference these shapes.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Yes | `*.myshopify.com` — used for both Admin and Storefront API hostnames |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Yes* | `shpat_…` static admin token (server-only) |
| `SHOPIFY_ADMIN_CLIENT_ID` + `SHOPIFY_ADMIN_CLIENT_SECRET` | Yes* | Alternative OAuth credentials (either this or token above) |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Optional | Enables real-time Shopify Cart sync and Cart Drawer checkout URL |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical URL base for SEO metadata and og:url |
| `NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL` | Optional | Custom storefront domain for cart permalink fallback |
| `SHOPIFY_WEBHOOK_SECRET` | Optional | HMAC secret for `/api/revalidate` webhook verification |
| `REVALIDATE_SECRET` | Optional | Token for manual cache invalidation via `POST /api/revalidate?secret=…` |

*One of the admin credential options is required for catalog to work.

`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` must be the `.myshopify.com` host, not the public storefront domain. The `lib/shopify/domain.ts` `normalizeStorefrontApiHost` function enforces this and throws if given a custom domain.
