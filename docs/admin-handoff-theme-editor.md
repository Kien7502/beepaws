# Handoff → storefront: theme editor (visual composer)

Owner ask: seasonal/holiday themes that change **per-section colour, texture, and
freely-placed decorations** (a Christmas bell, garland, snow…), edited on a canvas in
the admin tool rather than in storefront code.

**Status (2026-07-24):** the admin half is **BUILT** (unverified in the live UI). The
`read_files` + `write_files` scopes are **granted** and the upload→CDN→delete path is
verified live. This doc is the contract for the **storefront renderer**, which is the
remaining work (own session in `../beepaws`).

> **Model change from the first draft (2026-07-21).** The original fixed-slot design
> (global texture + 4 named decoration slots, band colours in the palette) was replaced
> by a **visual composer**: palette holds only global *accents*, each page **section**
> owns its background/text/texture, and decorations are **freely positioned sprites**.
> If you already started on the old shape, this supersedes it.

## Storage contract

ONE shop metafield, `beepaws.theme`, type `json` (ownerId = shop gid
`gid://shopify/Shop/83346981089`, written via the `metafieldsSet` the tool already uses).
Absent/empty = built-in default (Warm Honey). Shape:

```jsonc
{
  "name": "Evergreen",               // label for the tool's UI; NOT read for styling
  "palette": {                        // global ACCENT tokens only. OMITTED keys = default.
    "clay": "#2f6f4e",
    "gold": "#c9a227"
  },
  "sections": [                       // per-part overrides; a section absent = all defaults
    {
      "id": "hero",                   // one of the fixed section ids (table below)
      "bg": "#eef3ec",                // optional hex background override
      "ink": "#20301f",               // optional hex text-colour override
      "texture": {                    // optional tiled surface for THIS section
        "url": "https://cdn.shopify.com/…",
        "opacity": 0.06,              // 0–0.2
        "tileSize": "480px"           // CSS background-size; "cover" allowed
      }
    }
  ],
  "decorations": [                    // optional; freely-placed sprites
    {
      "id": "d1a2b3",                 // stable unique id
      "src": "https://cdn.shopify.com/…",
      "section": "hero",              // which section it lives in
      "x": 82,                        // 0–100, % of section WIDTH  — CENTER anchor
      "y": 18,                        // 0–100, % of section HEIGHT — CENTER anchor
      "width": 22,                    // 1–100, % of section width (height follows aspect)
      "rotation": -8,                 // degrees, -180…180
      "opacity": 1                    // 0–1
    }
  ]
}
```

The admin validates on both read and write (`lib/theme.ts`: `sanitizePalette`,
`sanitizeSections`, `sanitizeDecorations`) — unknown palette keys dropped, unknown
section ids dropped, coordinates clamped to range, sections with no override omitted. The
storefront **must apply the same filter** and treat the metafield as untrusted.

### Palette rule (non-negotiable — it is what keeps themes accessible)

`palette` may set only the global **accent** tokens:
`clay`, `gold`, `gold-deep`, `amber`, `rose-soft`.

It must NEVER set the ink ramp (`ink`, `cocoa`, `brown`), the base surfaces
(`paper`, `cream`, `card`), or `line` — those carry every text-contrast pair on the site,
and leaving them fixed is why a theme can't silently break WCAG AA. Ignore any other key.
Green (`moss`/`sage`) stays reserved for "plant-derived" (storefront `DESIGN.md`), so it
is deliberately not theme-settable.

Band/surface COLOURS are no longer palette tokens — they're per-section `bg`/`ink` now.

### Sections (fixed set)

Overrides target these ids. `defaultBg`/`defaultInk` mirror the storefront's current
`:root`/section styling — the admin previews against them and runs the contrast check
against them when nothing is overridden.

| id | region | defaultBg | defaultInk |
|---|---|---|---|
| `header` | top nav bar | `#FFFFFF` | `#4A2E16` |
| `hero` | main banner (first section) | `#F2E7CC` | `#4A2E16` |
| `feature` | benefit cards band | `#F6E6C6` | `#4A2E16` |
| `mechanism` | "how it works" band | `#E5C58C` | `#4A2E16` |
| `final-cta` | closing call-to-action band | `#5E3C22` | `#FBF3E1` |
| `footer` | site footer | `#4A2E16` | `#FBF3E1` |

A section override may carry any of `bg` / `ink` / `texture`; omitted fields fall back to
the defaults above. The admin shows a **live WCAG contrast** readout for each section's
`bg` vs `ink` and warns below 4.5:1 — but it does NOT block publishing, so the storefront
should still keep the locked ink ramp as the ultimate guard for body copy.

### Decorations (free placement)

Each decoration is one image placed **inside a section**, positioned by percentage with a
**center anchor**, so it scales with the section at any viewport width. Render:

```
position: absolute;
left: {x}%; top: {y}%;
width: {width}% (of the section box);      height: auto;
transform: translate(-50%, -50%) rotate({rotation}deg);
opacity: {opacity};
pointer-events: none;                       /* purely decorative */
```

Array order = paint order (later = on top). All decorative → render `aria-hidden` with
`alt=""`. The section is the positioning context (`position: relative; overflow: hidden`
so a sprite bleeding off an edge is clipped, not scrollbar-inducing).

**Craft guardrails** (festive vs tacky — the storefront won't compensate for bad assets):
real uploaded artwork only, transparent-background PNG/SVG, one or two good sprites beat a
dozen. The admin lets you place many; restraint is on the author.

## What the storefront builds (remaining work)

- `lib/shopify/theme.ts` — read + validate `beepaws.theme` (same filter as above: drop
  unknown/locked keys, clamp opacity/coords, verify `url`/`src` are Shopify CDN hosts),
  cached with a `theme` tag.
- `app/layout.tsx` — emit the validated **accent** palette as an inline `<style>` variable
  block on `<html>` (server-rendered, no flash).
- Section components (Header, Hero, the bands, Footer) — apply the matching section's
  `bg`/`ink`/`texture` when present (custom properties or inline style), and render that
  section's decorations as the absolutely-positioned sprites above. No-op when a section
  has no override and no decorations.
- `/api/revalidate` gains a `theme` tag so publishing takes effect without a redeploy.
  Worth a "Publish + revalidate" ping from the admin (as the storefront preview already
  does) — otherwise the owner waits for ISR.

The existing static default styling stays as the fallback; the metafield wins when present
and valid.

## Admin side (already built — for reference)

- `/theme` list (cards, like Bundles) → `/theme/new` and `/theme/[slug]` open the
  composer (`components/ThemeComposer.tsx`): an editable canvas of the sections above;
  click a section to recolour/texture it, upload a decoration and drag it to position /
  drag its corner to resize, plus size/rotate/opacity controls.
- Drafts: `data/themes/<slug>.json` (stable slug id, decoupled from the display name).
  Publish writes the metafield; "Reset to default" clears it (`DELETE /api/theme`).
- Uploads go through `/api/files` → adapter `uploadImage` (stagedUploadsCreate IMAGE →
  POST → fileCreate → poll for CDN url), WebP-converted client-side first (SVG passes
  through).

## Sequencing

Post-launch feature; additive — an absent/empty metafield renders the default, so shipping
the renderer can wait until after launch blockers.
