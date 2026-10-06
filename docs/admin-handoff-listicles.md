# Handoff → storefront: listicles (editorial landing pages)

Owner ask (2026-10-06): author ad landing pages ("8 Reasons Dog Moms…") **in the admin
app**, rendered by the storefront. Built on both sides the same day — this is the contract
between them. Copy + design came from the owner's `BeePaws_Listicle_Complete.md` and
`BeePaws_Listicle_Visual_Reference.md` (in this repo's `docs/`).

## Storage

One **shop metafield per listicle**: namespace `beepaws_listicles`, key = the slug
(`[a-z0-9-]`, 2–64 chars), type `json`, value = the listicle document below. Published
page: `/journal/<slug>`. Unpublishing deletes the metafield.

Why not metaobjects: the store is moving to WooCommerce later. The document is OUR format —
nothing Shopify-specific — so the move is "store the same JSON in WordPress and change the
reader"; the editor and the page don't change. One field per listicle so they never share a
size budget, and no extra API scopes. Admin: `listListicles` / `setListicle` /
`deleteListicle` on the commerce adapter (`capabilities.listicles`; Woo stub = false).

## Document shape (`lib/listicle.ts` admin ⇄ `lib/shopify/listicles.ts` storefront)

```jsonc
{
  "slug": "tartar-off-at-home",
  "seoTitle": "", "seoDescription": "",          // "" = headline / subhead
  "topStrip": "BeePaws Journal · Dog Dental Care",
  "headline": "…", "subhead": "…",
  "byline": { "author": "…", "date": "…", "readTime": "5-minute read" },
  "checklist": ["…"],                              // ✓ lines above the fold
  "topCta": { "label": "See How It Works →", "href": "/products/…", "note": "small print" },
  "hero": Image,
  "sections": [
    { "id": "s-…", "kind": "intro" | "reason" | "plain", "heading": "…", "blocks": [Block] }
  ],
  "stickyCta": { "enabled": true, "label": "…", "href": "/products/…" },
  "footer": { "line": "…", "disclaimer": "…" }
}
// Image = { "src": "https://cdn.shopify.com/…", "alt", "caption", "width"?, "height"? }
// Block (all carry "id"):
//   { "type": "text", "text" }
//   { "type": "image", "image": Image }
//   { "type": "quote", "text", "attribution" }
//   { "type": "callout", "title", "text" }
//   { "type": "cards", "title", "items": [{ "title", "text", "check" }] }
//   { "type": "timeline", "title", "items": [{ "label", "text" }] }
//   { "type": "cta", "style": "button" | "link", "label", "href", "note" }
//   { "type": "product", "product": { "handle", "title" } | null, "name", "image": Image,
//     "contentsTitle", "contents": [string], "note", "compareLine",
//     "ctaLabel", "ctaHref", "ctaNote" }
```

Rules (both sides sanitize — the storefront treats the metafield as untrusted):

- **Text is plain** with three inline markers: `**bold**`, `*italic*`, `[label](url)`. A
  blank line starts a new paragraph. Never rendered as HTML (`withInline` in
  `lib/inline-format.tsx`). Links render only for an internal path or http(s).
- **Reasons are numbered by order** ("01. Heading"); `intro` and `plain` sections aren't.
- **Images**: storefront keeps only `cdn.shopify.com` URLs. `width`/`height` are the natural
  size (the editor records them) so the page reserves the space; `caption` shows under the
  image — the owner's images are AI illustrations, captioned "Illustration".
- **Cards' `check`** line renders with a ✓ only when filled — the guide shows "✓ BeePaws:
  yes" once a spec is confirmed; until then the seeded draft holds an `[edit…]` placeholder
  there.
- **Product card price is never authored**: the storefront reads the product (by handle)
  and shows its current price; image falls back to the product's photo.
- **Floating button** (`stickyCta`): appears at the first reason, hidden from the first
  product card / button CTA onward (`data-listicle-start` / `data-listicle-end` markers).
- Unknown block types are dropped; strings are length-capped; hrefs must be `/…` or http(s).

## Storefront

- `/journal/[slug]` — ISR like the PDP (`generateStaticParams` from the namespace,
  `revalidate = 3600`, cache tag `listicles`). No site header/footer/back-to-top on journal
  pages (`components/layout/SiteChrome.tsx`).
- `/preview/listicles/[draft id]?admin=<port>` — renders the admin's local draft
  (`GET /api/listicles/<id>` on the admin), dev-gated like the other previews.
- `/api/revalidate` accepts `tag=listicles`; the admin calls it after Publish / Unpublish.
- Print: plain column, nothing sticky — the admin's PDF button works on these pages too.

## Admin

`/listicles` (list) · `/listicles/[id]` (editor). Drafts in `data/listicles/<id>.json`
(stable id ≠ slug). API: `/api/listicles` (GET list with live/changed status · POST new) ·
`/api/listicles/[id]` (GET · PUT · DELETE, refused while live) · `…/publish` (POST publish,
DELETE unpublish). Publishing to a new slug takes the old address down after the new one is
live. The editor warns about `[edit…]` placeholders left in the copy (they'd show on the
page) and counts them per section.
