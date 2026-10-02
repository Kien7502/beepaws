# Handoff → storefront: homepage editor (image blocks)

Owner ask: edit the homepage's pictures (and light copy) from the admin tool
instead of in storefront code.

**Status (2026-08-15):** the admin half is **BUILT** (unverified in the live UI).
The storefront homepage is hardcoded today and its photos are still placeholders,
so this **authors ahead** — exactly like the theme editor. This doc is the contract
for wiring the storefront homepage to read the metafield (post-launch, own session).

## Storage contract

ONE shop metafield, `beepaws.homepage`, type `json` (ownerId = shop gid
`gid://shopify/Shop/101774655859`, written via the same `metafieldsSet` the tool uses
for the theme). Absent/empty = the built-in hardcoded homepage. Shape:

```jsonc
{
  "blocks": [                          // ORDERED list; render/order as given
    {
      "id": "hb-abc123",               // UI-only stable id; ignore for rendering
      "key": "hero",                   // UNIQUE slug — map the block to a slot by THIS
      "image": "https://cdn.shopify.com/…",  // "" = a text-only block
      "alt": "Golden retriever mid-brush",   // accessible alt; "" allowed
      "focusX": 63.6,                  // optional focal point, % of the image (0-100);
      "focusY": 49.8,                  //   both or neither — absent = centre
      "zoom": 1.4,                     // optional, 1-2 around the focal point; absent = 1
      "heading": "Fresh breath, happy pet",  // optional
      "body": "The at-home dental tool.\nVet-loved.",  // optional, PLAIN text, may have \n
      "ctaLabel": "Shop now",          // optional
      "ctaHref": "/products/dental"    // optional; internal path or absolute URL
    }
  ]
}
```

Rules (the admin enforces these in `lib/homepage.ts` `sanitizeHomepage`, and the
storefront **must** re-apply the same filter — treat the metafield as untrusted):

- **`key` is the contract.** Slugified (`[a-z0-9-]`, ≤48 chars), non-empty, unique
  within the doc (the admin de-duplicates on save). Map a block to a homepage slot
  by its key (e.g. `hero`, `founder`, `proof-1`), NOT by array index — though order
  is preserved if you want to render them as a sequence.
- **Text is PLAIN, not HTML/markdown.** `heading`/`body` are literal strings (body
  may contain `\n` line breaks). Render as text through the storefront's own
  typography — never `dangerouslySetInnerHTML`. (If emphasis is wanted later we'll
  agree a small markdown subset; not now.)
- **`image`** is a Shopify CDN URL (validate the host). `""` means no image —
  a text-only block. Use `alt` for the `alt` attribute.
- **`ctaHref`** may be an internal path (`/products/…`) or an absolute URL; render a
  link/button only when both `ctaLabel` and `ctaHref` are non-empty.
- **Crop (`focusX`/`focusY`/`zoom`, 2026-10-01/02).** Every slot crops its image
  with `object-fit: cover`, and one image lands in very different shapes (the hero
  is ~2:1 on desktop but a ~0.55:1 strip on phones). Render with
  `object-position: X% Y%` and, when `zoom > 1`, `transform: scale(zoom)` with
  `transform-origin: X% Y%` (centre when no focal point) inside the slot's
  `overflow: hidden` box. The focal point stays put and the slot stays filled.
  Scale every `vw` length in the image's `sizes` hint by the zoom so a sharper
  file is fetched. Sanitize: focal point kept only when BOTH halves are finite
  (clamped 0–100); zoom kept only when > 1, capped at 2. Storefront:
  `lib/home-crop.ts`; admin: `cropStyle` in `lib/homepage.ts` (the editor's
  crop previews run the same CSS). Keep the two in sync.

## What the storefront builds (remaining work)

- `lib/shopify/homepage.ts` — read + validate `beepaws.homepage` (same filter:
  slugify/unique keys, verify image host, coerce strings), cached with a `homepage`
  tag.
- Wire the homepage sections to look up their block by `key` and render its image +
  heading/body/CTA, falling back to the current hardcoded content when the block is
  absent (so an empty/absent metafield = today's page). Decide per-section which keys
  it consumes; publish a short "keys the homepage reads" list back to the owner so the
  admin keys match.
- `/api/revalidate` gains a `homepage` tag so publishing takes effect without a
  redeploy (worth a "Publish + revalidate" ping from the admin later).

## Admin side (already built — for reference)

- `/homepage` page (`components/HomepageEditor.tsx`): an ordered list of block cards —
  per block, upload/replace an image (WebP-converted, → Shopify Files CDN via
  `/api/files`), set the slot key, alt, heading, body, and a CTA (label + link);
  reorder (↑/↓), duplicate, remove.
- Local draft at `data/homepage.json` (`/api/homepage/draft`); **Publish** writes the
  metafield (`/api/homepage` → adapter `setHomepage`), **Reset** clears it
  (`clearHomepage`). Behind `capabilities.homepage` (Shopify true, Woo false).
- Metafield read/write/clear verified live 2026-08-15.

## Sequencing

Post-launch, additive: an absent/empty metafield renders today's homepage, so wiring
the storefront can wait until after launch.
