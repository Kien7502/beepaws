# Plan: live draft preview from beepaws-admin (Phase B)

> **STATUS: BUILT (2026-07-02).** `components/product/ProductPageView.tsx` (shared PDP render,
> async), `lib/shopify/draft-preview.ts` (`beepawsFromDraft` + `fetchAdminDraft`), and
> `app/preview/products/[handle]/page.tsx` (guarded, `force-dynamic`) all exist; `next build`
> (webpack) passes. **How to run the live preview:** start this storefront `npm run dev -- -p 3001`,
> then in the **admin's Connection settings** set **"Local preview port" = 3001** (a field the admin
> now provides — no need to type the full URL). Open a product editor → **Preview**. Edit → the admin
> debounce-saves the draft + reloads the pane → this route re-fetches the draft.
> **Admin ↔ storefront wiring:** this route fetches the admin draft at `BEEPAWS_ADMIN_URL` (default
> `http://localhost:3000`), so the admin must be reachable there. The admin **desktop app uses a random
> free port by default** — for the desktop live-preview loop, launch it with `BEEPAWS_PORT=3000` (pins
> the port), or run the admin via `npm run dev` (:3000), or set `BEEPAWS_ADMIN_URL` to the admin's
> actual port.


> For whoever works in **this** (`beepaws` storefront) repo. Goal: let the **beepaws-admin**
> tool (sibling repo `../beepaws-admin`) show this storefront rendering its **unsaved draft**
> content — "as you type" — in its desktop preview pane.

## Background

- **beepaws-admin** is a local tool where the team authors the `beepaws.*` PDP content. It keeps
  edits as **local drafts** (`data/products/<handle>.json`) and only writes them to Shopify
  metafields on **Push**.
- This storefront renders the PDP from **Shopify metafields**:
  `app/products/[handle]/page.tsx` → `getFullProductForPage(handle)` →
  `adminGetFullProductsForPage` → **`normalizeMetafields()`** (in
  `lib/shopify/admin-product-page.ts`) → `fullProduct.normalized.beepaws`, which the page passes
  into the section components (PainPoints, Mechanism, UGCReviews, FAQSection, ComparisonTable, …).
- So today the admin's preview only shows **pushed** content. Phase B makes a **preview route**
  render from the admin **draft** instead, so the team sees edits before pushing.

## The contract from beepaws-admin (already / will be provided)

- **Draft endpoint** (exists): `GET http://localhost:3000/api/products/<handle>` returns
  ```json
  { "handle": "...", "exists": true, "backendExists": true, "imageUrl": "...|null",
    "content": { /* beepaws fields, snake_case keys + top-level "tags": [] */ } }
  ```
  `content` values are **already native JSON** (arrays/objects for the JSON fields, plain strings
  for `tagline` / `education_note`) — **no `JSON.parse` needed** (unlike Shopify metafields, which
  are JSON strings).
- The admin's preview pane points its webview at a **configurable URL**
  (`BEEPAWS_STOREFRONT_URL`). For Phase B it'll be set to this storefront's **local** preview
  route, e.g. `http://localhost:3001/preview/products/{handle}`.
- The admin will **debounce-auto-save** the draft and **reload** the preview webview, so each
  reload re-fetches the latest draft. (That part is implemented in `beepaws-admin`.)

## Why this must run locally

A Vercel-**deployed** storefront can't reach the admin's `localhost`. For live preview you run
**both locally**: admin on `:3000`, this storefront on `:3001` (`next dev`). The preview route
fetches the draft **server-side** (it's a server component), so **no CORS is needed**.

## What to build here

### 1. Extract the PDP body into a shared view (refactor, no behavior change)
`app/products/[handle]/page.tsx` mixes data-fetching with a large JSX body. Pull the **render**
into `components/product/ProductPageView.tsx` taking the already-fetched data:
```tsx
export function ProductPageView({ product, fullProduct, paymentMethods, recommended }: {...}) { /* the current return JSX */ }
```
Have the real product page call it unchanged. This lets the preview route reuse the exact UI.

### 2. Map an admin draft → the `beepaws` shape
Add `lib/shopify/draft-preview.ts`:
```ts
import type { BeepawsMetafields } from "@/types/metafields";

// Admin draft content (snake_case keys, native values) → normalized.beepaws.
// This is the inverse of the parseBeepaws() map in admin-product-page.ts.
export function beepawsFromDraft(content: Record<string, any>): BeepawsMetafields {
  const g = (k: string) => content?.[k] ?? null;
  return {
    comparisonRows:    g("comparison_rows"),
    useCases:          g("use_cases"),
    faqItems:          g("faq_items"),
    reviews:           g("reviews"),
    stats:             g("stats"),
    techSpecs:         g("tech_specs"),
    bullets:           g("product_bullets"),
    ingredients:       g("ingredients"),
    tagline:           g("tagline"),            // string
    educationNote:     g("education_note"),     // string
    beforeAfterSlides: g("before_after_slides"),
    bundleTiers:       g("bundle_tiers"),
    painPoints:        g("pain_points"),
    painPointsIntro:   g("pain_points_intro"),
    mechanismSteps:    g("mechanism_steps"),
    mechanismIntro:    g("mechanism_intro"),
    guarantee:         g("guarantee"),
    useCasesIntro:     g("use_cases_intro"),
    comparisonIntro:   g("comparison_intro"),
    faqIntro:          g("faq_intro"),
    reviewsIntro:      g("reviews_intro"),
    beforeAfterIntro:  g("before_after_intro"),
    finalCtaCopy:      g("final_cta_copy"),
  };
}

export async function fetchAdminDraft(handle: string) {
  const base = process.env.BEEPAWS_ADMIN_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/products/${handle}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<{ content: Record<string, any>; }>;
}
```
(Keep this key map in sync with `parseBeepaws()` in `lib/shopify/admin-product-page.ts` — same 23
keys.)

### 3. Add the preview route
`app/preview/products/[handle]/page.tsx`:
```tsx
export const dynamic = "force-dynamic"; // never cache a draft

export default async function PreviewProductPage({ params }) {
  if (process.env.NODE_ENV === "production" && process.env.BEEPAWS_PREVIEW_ENABLED !== "1") {
    notFound(); // dev/local only — never a public draft viewer
  }
  const { handle } = await params;
  const [fullProduct, product, paymentMethods, draft] = await Promise.all([
    getFullProductForPage(handle),   // base product + Shopify-pushed normalized
    getProduct(handle),
    getPaymentMethods(),
    fetchAdminDraft(handle),
  ]);
  if (!product || !fullProduct) return notFound();

  // Override ONLY the beepaws content with the draft; keep base product (price,
  // images, variants) and the other normalized fields (usage_guide/qna/bundle_buy)
  // from Shopify. Optionally override tags for the isDevice gating.
  const merged = draft
    ? { ...fullProduct,
        tags: draft.content.tags ?? fullProduct.tags,
        normalized: { ...fullProduct.normalized, beepaws: beepawsFromDraft(draft.content) } }
    : fullProduct;

  return <ProductPageView product={product} fullProduct={merged} paymentMethods={paymentMethods} /* + recommended */ />;
}
```

### 4. Env
- `BEEPAWS_ADMIN_URL` (default `http://localhost:3000`) — where to fetch drafts.
- `BEEPAWS_PREVIEW_ENABLED` — only to allow preview in a non-dev build (normally leave unset).

## Caveats / notes

- **Base product still comes from Shopify** — so the product must exist in Shopify. The draft
  overrides only the `beepaws.*` marketing content (the below-fold sections + hero bullets/
  tagline). Price, images, variants, rating come from Shopify.
- `normalized.usage_guide`, `qna`, `bundle_buy` come from `custom.*` metafields / product
  references — the admin draft doesn't manage those, so **don't** override them.
- `product.rating` (hero stars) may be derived from the pushed reviews, not the draft — so the
  star count might not reflect draft review edits. The UGCReviews section *will* reflect the draft.
- Empty/missing draft fields → `null`, which the section components already fall back to defaults
  for (same as today).

## Flow once built

edit in admin → admin debounce-saves the draft → admin reloads the preview webview →
this route re-fetches `/api/products/<handle>` (no-store) → renders the PDP via `ProductPageView`
with `normalized.beepaws` from the draft.
