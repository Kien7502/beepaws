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

**Content icons (2026-09-15):** authored icon names (`beepaws.faq_items`, `product_bullets`, `comparison_rows`) resolve through `lib/content-icons.ts`, which maps lucide's **entire** `icons` catalog (~1700) so the admin picker can offer any of them without a hand-mirrored list going stale. That module is `server-only` **on purpose** — importing the catalog into a client component ships ~400KB of unused glyphs. A client component that needs an authored icon receives it as a rendered ReactNode from its server parent; `FAQSection` (server: data + glyphs) / `FAQAccordion` (client: open state only) is the pattern to copy.

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

### Bundles

Real Shopify bundles (created by the sibling admin tool, always tagged `bundle`): they are hidden from collection listings; a bundle's own PDP renders a "What's included" section from `lib/shopify/bundle-contents.ts`; a regular product's pricing tier can link a bundle via `beepaws.bundle_tiers[i].bundle`, which drives an inline bundle picker in `VariantSelector` (Add/Buy adds the chosen bundle variant). Contract doc: `docs/bundles-from-admin.md`.

### Admin draft preview

`app/preview/products/[handle]/page.tsx` (guarded, `force-dynamic`) renders the shared `components/product/ProductPageView.tsx` with the `beepaws.*` content (+ tags) overridden by a live draft fetched server-side from the admin tool at `BEEPAWS_ADMIN_URL` (default `http://localhost:3000`); price/images/variants stay from Shopify.

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

## Admin handoffs (post-launch wiring)

The BeePaws Admin tool (sibling repo `../beepaws-admin`) now authors several shop-level
documents into `beepaws.*` metafields **ahead of** the storefront reading them. Each has a
contract in `docs/admin-handoff-*.md`. All are **additive** — an absent/empty metafield
renders today's built-in defaults — so wiring them is post-launch, not a blocker.

- **Homepage** (`docs/admin-handoff-homepage.md`) — ✅ **WIRED** (`a6012a8`).
  `lib/shopify/homepage.ts` reads + validates `beepaws.homepage`; the markup lives in
  `components/home/HomePageView.tsx` (blocks passed in as a prop) and each slot looks up
  its block **by key** with per-field fallbacks, so an absent metafield renders today's
  hardcoded page. Keys consumed (`HOMEPAGE_KEYS`): `hero`, `healthy-home`, `why-scene`,
  `proof-1/2/3`, `dental-spotlight` — published back to the admin repo's copy of the doc.
  Real photos are still placeholders; publishing blocks is how they land.
  **Preview** (`f36cb17`): `/preview/homepage` renders the admin's unsaved draft,
  `?mode=published` renders the live metafield UNCACHED (so a draft-vs-live compare can't
  show stale ISR content); the PDP preview gained the same `?mode=published`. Both are
  dev-gated (404 in prod without `BEEPAWS_PREVIEW_ENABLED=1`).
- **Theme** (`docs/admin-handoff-theme-editor.md`) — visual composer → `beepaws.theme`
  (accents-only palette + per-section bg/ink/texture + placed decoration sprites).
- **Variant groups** (`docs/admin-handoff-variant-groups.md`) — combined listings.

Treat every metafield as untrusted: re-apply the admin's validation (drop unknown keys, clamp
ranges, verify CDN hosts) rather than trusting the stored JSON.

## PDP performance (flagged from admin-side review, 2026-08-19)

The product page feels slow to load (also visible as a slow preview pane in the admin tool).
Grounding: the real PDP is ISR-cached (`revalidate = 3600`) and the data layer uses
`unstable_cache` + `revalidateTag("products")`, so **warm** loads are fine. The cost is the
**cold render** (cache miss / post-revalidation) and the **`/preview/*` routes** — those are
`force-dynamic` by design, so they never cache and always pay full price. The admin's preview
pane renders that uncached draft route, so its slowness is largely expected, not a bug.

**UPDATE 2026-08-19 pt.2 — the REAL cause was missing caching (`f3c9224`).** After the
waterfall fix the owner still saw multi-second spikes. Measurement showed every request
hit Shopify even in production: `adminGraphqlFetch` defaults to `cache: "no-store"` and
the catalog call sites never opted into `force-cache`, which also defeats the
`unstable_cache` wrapper in `queries.ts` (a no-store fetch inside it caches nothing). All
8 call sites now pass `force-cache` + tags. Production warm requests went **1.2–2.0s →
~0.07s (~20x)** and Shopify quota for 20 renders **~1492 → ~95 points**; dev went
1.64s → 0.85s. Rate limiting was ruled out first (bucket 2000, restore 100/s, ~26/render).
⚠ **Consequence:** catalog data is cached until `revalidateTag("products")`. The
`/api/revalidate` webhook fires that, but `SHOPIFY_WEBHOOK_SECRET` / `REVALIDATE_SECRET`
are NOT set locally — **set them at deploy**, or published changes lag up to the 1h ISR
window. Admin draft previews stay live regardless (the draft is fetched `no-store`).

**UPDATE 2026-08-19 — the waterfall is FIXED (`8760433`).** `ProductPageView` made
~8 top-level awaits in sequence; they were mutually independent, so they now resolve in
one `Promise.all` (dependent work — tierGifts, tierKitDeals — still follows it).
Measured on dev (passthrough caching = every fetch real): median **2.65s → 1.64s**, and
the spread tightened from 1.05s to 0.31s. Rendered markup verified byte-identical.
The remaining items below are still open.

Where to optimise the cold render further:
- Audit how many **sequential** Shopify round-trips the PDP makes on a miss (product +
  variant-groups + discounts + recommendations + reviews + …). Run independent fetches in
  `Promise.all` to kill waterfalls, and wrap each sub-fetch in `unstable_cache` with its own
  tag so one revalidation doesn't re-fetch everything (variant-groups / discounts / homepage
  already do this — audit the main product fetch + any per-request ones).
- Optional UX: Suspense/streaming so the shell + hero paint while slower bands (reviews,
  recommendations) stream in; a light skeleton in the preview route so it feels responsive
  despite being deliberately uncached.

## Mobile card sliders (planned 2026-09-15, BUILT 2026-09-16)

**Status 2026-09-16:** built as planned — `components/product/Slider.tsx` (`useSlider`, `SliderArrow`, `SliderDots`,
`SliderControls`, `CardSlider`), ComparisonSlider refit onto it. Verified on a production build: phone screenshots of all
sliders; desktop geometry identical to the pre-change build. Follow-ups the same day (owner feedback):
- **Arrows must stay in view on tall content.** UseCaseCards passes `overlayArrowsAt` (side arrows centred on the square
  image via `50cqw`, hidden at either end; dots stay below). The comparison table's arrows flank the column title at the
  top (`‹ icon ›`). Short text cards (pain points, mechanism steps) keep arrows + dots below — overlaid arrows would cover
  their text.
- **Relative moves use `step(delta)`** (functional update), never `go(active ± 1)`: computing from the render's closure
  dropped a tap when two landed before a re-render. Dots keep absolute `go(i)`.

Owner wants the **PainPoints**, **Mechanism steps** and **UseCaseCards** sections on phones to use
the same slider as the comparison table (`components/product/ComparisonSlider.tsx`: arrows, dots,
swipe, one item per slide) instead of stacking three full-width cards.

- **Targets:** `PainPoints.tsx` (card grid ~L56), `Mechanism.tsx` (the numbered STEPS grid ~L161
  only — not the diagram/copy row), `UseCaseCards.tsx` (~L65). All three are server components
  whose cards sit in `grid md:grid-cols-3`, i.e. one stacked column below md.
- **Plan:** pull the slider behaviour out of ComparisonSlider into shared pieces (a `useSlider`
  hook for active index + swipe — 40px threshold with a horizontal-axis check — and a
  `SliderControls` arrows+dots component), then build a client `CardSlider` on them with a
  translated track (420ms `cubic-bezier(0.22,0.61,0.36,1)`, same as ProductGallery). Refit
  ComparisonSlider onto the same pieces so the behaviour has one implementation.
- **Cards stay server-rendered** and arrive as `ReactNode` slides. That's mandatory, not style:
  `lib/content-icons.ts` is `server-only`, and it also keeps `next/image` rendering on the server.
- **Render the cards ONCE and let CSS switch layouts:** below md the track is a translated flex
  strip plus controls; at md+ it becomes the existing `grid-cols-3`, controls hidden and the
  transform cleared (`md:!transform-none` — the transform is an inline style, so it needs the
  important modifier). Don't copy the comparison table's phone-copy + desktop-copy approach
  here: it would duplicate every card, and for UseCaseCards/Mechanism every image.
- **Keep:** equal card heights (a flex track stretches slides to the tallest), `aria-hidden` on
  off-screen slides, desktop pixel-identical. Verify with screenshots at 390px and 1280px
  (method: admin repo memory "storefront screenshot harness").

## Phone hero sizing (2026-09-16, owner-approved)

Set by measurement on a production build, not by eye — re-measure (admin memory "storefront screenshot harness") before
changing any of these:
- **H1 is `text-pretty`, never `text-balance`.** Balance shortens every line of a multi-line headline, so it stopped well
  short of the column edge (longest line 72–89% of the width) and read as squished left.
- **H1 is 28px below md** (40px from md). The full-sentence headline is 5 lines on 360–430px phones at any size from 24 to
  33px (Fraunces is wide) — so size buys height, not lines. Draft B would be 4 lines at 28px on a 390px phone.
- **Stacked hero grid gap is 20px below md** (`gap-5 md:gap-10`) — 40px left a hole under the thumbnails.
- **Gallery thumbs target 56px when the gallery is < 480px wide** (`THUMB_MIN_PHONE` / `PHONE_GALLERY_MAX` in
  ProductGallery; the pre-measure reserve mirrors it with `@min-[480px]`). 480 sits under the narrowest desktop gallery
  column (~503px at 1024px), so tablet/desktop thumbs are unchanged.
- Result at 390px: headline ends 794px down (was 889px). Remaining lever if it must clear real phone browser chrome: a
  shorter main image on phones (e.g. 4:3), which contradicts the hero doc's 4:5 recommendation.

## Security posture (public storefront)

Different profile than the admin tool (which is personal-use, local-only). The architecture
already covers the big items — keep enforcing rather than adding:
- **Server-only secrets:** `SHOPIFY_ADMIN_ACCESS_TOKEN` / client credentials must never reach
  the client bundle (server components / route handlers only). `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
  is public by design (scoped). Verify no admin token leaks client-side.
- **Untrusted admin-authored metafields are the main injection surface:** render `beepaws.*`
  as PLAIN TEXT (no `dangerouslySetInnerHTML`), CDN-host-only images, sanitised/clamped — as the
  handoff contracts mandate. A bad metafield value must never become executable markup.
- **Route protection:** `/preview/*` dev-gated (404 in prod without `BEEPAWS_PREVIEW_ENABLED=1`)
  and `/api/revalidate` secret-gated — keep both.
- **Checkout is Shopify's** (PCI/card handling out of scope; no card data touches the storefront).
  No user accounts today → minimal auth surface; revisit if login/accounts are ever added.
- Net: no big "add auth" task — it's a public catalog. Ongoing discipline = server-secret
  hygiene + treating metafields as untrusted.
