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

Catalog queries use `cache: "force-cache"` + `next: { tags: ["products"] }`. The webhook at `app/api/revalidate/route.ts` verifies the Shopify HMAC (or the admin's derived key) then calls `revalidateTag(tag, { expire: 0 })` — **immediate expiry, not `"max"`** (2026-10-12). With `"max"` (stale-while-revalidate) the caller's own warm-up request was served the OLD data while the refresh ran in the background: the admin's preview showed a bundle price the owner had just fixed until a second visit. Every caller here is an outside system announcing a change that already happened, which is exactly the case Next's docs give `{ expire: 0 }` for. Measured locally: with `"max"` the first visit after a refresh was as fast as the second (served stale); with `{ expire: 0 }` it waits for fresh data. Production keeps `"max"` until this branch deploys. Pages declare `export const revalidate = 3600` as ISR fallback; pages still on `force-dynamic` bypass all caching.

### Checkout

Two paths, both meaning "check out exactly these lines":
1. Cart drawer uses `cart.checkoutUrl` from the synced Storefront cart directly when available; otherwise it POSTs all items to `app/api/shopify/cart/checkout/route.ts`.
2. PDP "Buy It Now" (`VariantSelector`) POSTs its lines to the same route.

The route always creates a **fresh** Shopify cart via `createCartWithLines` and returns its `checkoutUrl`. Never reintroduce a persistent server-side cart with line merging — the old cookie-cart merge flow made every buy-now stack onto up to 14 days of earlier lines at checkout (bug fixed 2026-07-18); the route deletes the legacy `shopify_storefront_cart_id` cookie on each hit.

### Bundles

Real Shopify bundles (created by the sibling admin tool, always tagged `bundle`): they are hidden from collection listings; a bundle's own PDP renders a "What's included" section from `lib/shopify/bundle-contents.ts`; a regular product's pricing tier can link a bundle via `beepaws.bundle_tiers[i].bundle`, which drives an inline bundle picker in `VariantSelector` (Add/Buy adds the chosen bundle variant). Contract doc: `docs/bundles-from-admin.md`.

**Decision 2026-10-11 (owner): BUNDLES ARE THE KIT MECHANISM; composed kits scrapped — BUILT 2026-10-12 on `experiment/apple-design`.** Found while testing: every tier on the flagship silently fell back to the code-defined `TIERS` composition (device + spray as separate lines, $74.90) — the published Complete Care kit pointed at the spray's OLD handle, and the linked `bundle` product is a Draft on no sales channel. The rule (owner-approved, header comment in `VariantSelector.tsx`): a tier WITH a bundle link sells that bundle; the FIRST tier WITHOUT one sells the product alone (Starter Kit = device); any later unlinked tier, or one whose bundle can't be sold, is HIDDEN, never faked; with one visible tier the tier cards drop and the colour picker + button are the buy box; a product with NO tiers keeps quantity mode (the spray). Complete Care (index 1) is pre-selected when visible. Tier `badge` is authored (no hardcoded "Best value"). Tier gifts KEPT (owner) — product-alone tiers only, since the gift discount fires on the main product's line. Removed: `tierKits`/kit pickers/kit deals/kit subscriptions, the code-defined `TIERS` fallback and its add-on pool (two fewer Shopify queries per PDP render), the per-unit Family Pack pickers. Verified 2026-10-12 against live data: flagship shows only the device (its live tiers have no bundle links until the owner Pushes), cart gets 1 device; spray unchanged. Prices: the admin's `docs/beepaws-pdp-revision-2026-10-05.md` is the source of truth.
**No free-shipping claims anywhere (owner, 2026-10-13).** Every "Free shipping over $50" is gone — the header banner (every page), the buy-box trust line, the homepage strips, and the PDP's closing small print (content, admin draft). Each slot now carries something stronger: the banner leads with the **60-day** risk-free guarantee + "No anesthesia, no vet bill" (phones show only the guarantee — the full line wrapped and stranded "Shop now"); the buy box says "No anesthesia needed"; elsewhere "Real-person support". Adjacent "30-day" text became 60-day (revision doc 2026-10-05). Also removed: "Safe & vet-approved" on the homepage strip (no vet behind the claim) → "No anesthesia needed". Don't reintroduce a shipping promise unless the store's shipping rules actually back it.
**Kit naming + cart (2026-10-12):** bundles are titled "{product} — {tier}" (admin convention + one-click rename; the title is what checkout shows). The cart drawer heads a tier bundle's line with the tier NAME and the product (linked to its page) underneath — `kit` on `LocalCartItem`, side-mapped by merchandiseId (`beepaws_kit_v1`) like the bundle components. **The same product twice:** the Family Pack can hold the device as two components so each has its own colour; the admin names the later copy's option "<title> Color (2nd)", which the tier card shows as its own picker ("Color (2nd)") while the top picker keeps the first device; the cart maps an ordinal option to that copy, and the "what's included" list folds copies into one row ("2× device"). **Kit picture (owner, 2026-10-12):** a bundle without its own image shows the product's photo in the picked colour — in the cart drawer (stored on `kit.imageUrl`, since a synced line carries Shopify's empty bundle image) and the floating bar. `TierBundle.imageUrl` is null when the bundle has none. Checkout still shows the bundle's own image. **Fixed the same day:** in dev, every reload wiped the cart's side-maps (bundle contents, flavour labels, tier names) — `useStoredState` wrote its initial `{}` over the stored value before reading it, and React's dev double-run of effects then read that `{}` back. It now writes only after the read. Production doesn't run effects twice, so it most likely wasn't affected there (not measured).

**Cart "already sold out" (fixed 2026-10-11):** after the 2026-09-08 store move every cart line came back quantity 0 / $0 (`MERCHANDISE_OUT_OF_STOCK`) although Shopify showed stock + continue-selling: the stock sits at the HyperSKU app location, which wasn't in the shipping setup. Shopify had also moved the store to shipping-by-market, where the app location couldn't be added; the owner switched back to shipping profiles and added Hypersku. If carts start refusing everything again (e.g. when Shopify re-applies market shipping), check that first — ask the Storefront API for `cartCreate { warnings }`.

### Admin draft preview

`app/preview/products/[handle]/page.tsx` (guarded, `force-dynamic`) renders the shared `components/product/ProductPageView.tsx` with the `beepaws.*` content (+ tags) overridden by a live draft fetched server-side from the admin tool at `BEEPAWS_ADMIN_URL` (default `http://localhost:3000`); price/images/variants stay from Shopify.

### Design tokens

All colors and shadows are CSS variables in `app/globals.css` under `@theme inline` (Tailwind v4 syntax). Use `var(--color-primary)` etc. in classes — never hardcoded hex. No dark mode (next-themes was never wired up and was removed in the 2026-10-10 sweep).

### Gesture + buy-box pass (apple-design skill, 2026-10-10/11, branch `experiment/apple-design`, NOT yet merged)

- **Motion:** `lib/motion.ts` holds the shared spring (damping 1, response 0.38s), momentum projection, rubber band and the 8px direction lock. `useSwipeTrack` (`components/product/Slider.tsx`) drives the gallery, card sliders and comparison table (1:1 swipe, flick projection, velocity handed to the spring, catch mid-settle) via one CSS variable `--drag`; the before/after divider uses the same maths (scroll-safe on phones, glides on tap, grabbable knob).
- **Floating add-to-cart bar MIRRORS the buy box** (`components/product/BuyBoxSync.tsx`): `VariantSelector` publishes what its button would add; the bar shows that and runs the same add. The buy box's "Added to cart!" note shows only for its own button (from the bar it shifted the page above the viewport).
- **Press feedback:** real `<button>`s dip via the base rule; links styled as buttons use the `pressable` utility (`globals.css`). Slider dots are 24×40 buttons, arrows 40px.
- Running list + remaining items: `docs/pdp-visual-plan.md`. Verified with headless Chrome + CDP touch emulation; touch `:active` can't be driven there — check press feedback on a real phone.

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
one `Promise.all` (dependent work — tierGifts — still follows it).
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

## Listicles — /journal/<slug> (2026-10-06)

Editorial ad landing pages authored in the admin app (contract: `docs/admin-handoff-listicles.md`). One shop
metafield per listicle (`beepaws_listicles`, key = slug, value = our own JSON — portable to WooCommerce);
`lib/shopify/listicles.ts` reads + re-sanitizes it (KEEP IN SYNC with the admin's `lib/listicle.ts`),
`components/journal/ListicleView.tsx` renders it to the owner's visual reference: one 720px column, "01."
reason headings in Fraunces, thin gold rules, sand callouts/quotes that become a left gold border on phones,
full-bleed images on phones, a card stack and a timeline (line + dots on desktop only), a product card whose
price is read live by handle; reason numbers in clay; optional white/honey section bands (light only —
sand and dark were dropped for readability). `StickyCta` = the floating pill: from the first reason, steps aside
while an in-article button OR the soft text link is on screen, gone from the product card on. The draft preview
shows dashed placeholders for empty image slots (live pages skip them). 2026-10-07: `==highlight==` (thin 4px
band under the text, colour from the listicle's `highlight` via `--hl`), a trust row in the product card, and a
collapsed plain-text Sources block (no links — readers stay on the page). `withInline`
(`lib/inline-format.tsx`) renders `**bold**`, `*italic*`, `[label](url)` — never HTML. ISR like the PDP, tag
`listicles` (accepted by `/api/revalidate`). **No site header/footer/back-to-top on journal pages**
(`components/layout/SiteChrome.tsx`): single-purpose pages, the guide bans nav/popups there. Draft preview:
`/preview/listicles/[draft id]?admin=<port>`. Verified on a production build at 1280 + 390 (2026-10-06).

## Print styles (2026-10-02, for the admin's PDF export)

The admin tool's preview pane has a **PDF** button: Chromium prints the page onto US Letter, a faithful snapshot of
the screen layout (`../beepaws-admin/electron/main.cjs` `renderPagePdf`; it also hides `position: fixed` overlays and
un-sticks sticky bars itself). This repo's half is `@media print` at the end of `app/globals.css` plus `print:` classes:
reveal-on-scroll content (`.ds-reveal`, `.ds-reveal-in > *`, `.ds-stagger > *`) forced visible — without it, sections
printed as empty coloured bands; animations/transitions off; pictures, cards (`article`, block links), quotes and list
items never split across pages; slider arrows/dots `print:hidden` (Slider.tsx, BeforeAfterSlider); a phone CardSlider
stacks every card; the comparison prints the full desktop table at any width. **Keep:** a new scroll-triggered effect
must start visible in print; a new slider needs its controls hidden and its slides laid out flat in print.

## Section eyebrows: deliberately NOT rendered (2026-07-05, `78b04ab`)

Every below-fold section still receives an `eyebrow` (and Mechanism an `introEyebrow`) from ProductPageView, and every
one of them ignores it **on purpose**. The same uppercase tracked kicker above all seven sections read as AI-scaffolding
grammar (brand-register critique); each section leads with its display heading instead, and the background-colour rhythm
carries the "new section" signal. **The hero pill is the one deliberate eyebrow on the page.** The props were kept only so
a single named kicker could return one day.

Do not "fix" the unused props — the authored copy in `*_intro.eyebrow` is intentionally dormant. (Re-added 2026-09-19 by
mistake, reverted the same day: a heading reading flat is a typographic problem, not a missing kicker.)

## Hero copy decisions (2026-09-18, owner)

- **No price in the hero and no vet-bill anchor box.** Every purchase option shows its own price and the CTA carries the
  selected one, so the hero number was a second source for the same fact; the box's opening also repeated the headline.
  `DynamicHeroPrice` is unused but kept — restoring the price row is one line.
- **Two FAQs sit under the buy box** (hero doc §8), collapsed `<details>`, pulled from the product's own `faq_items` by
  keyword (scared/freak, slip/hurt) rather than retyped — edit the FAQ copy and both places follow. No match renders nothing.
- **Still open:** the `tagline` metafield (the two-line text under a title on product CARDS — /collections/all, each
  collection, and the PDP's "More from BeePaws") still holds the old anchor sentence and truncates mid-sentence.

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
