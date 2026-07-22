# Design

Captures the **current** ("Warm Honey") visual system as shipped on
`experiment/skill-design-taste`. This is the base the ongoing visual pass is elevating,
not a finished target. Source of truth for tokens: `app/globals.css`. Homepage spec:
`plans/beepaws-homepage-spec-CONSOLIDATED.md`. Prior UX review:
`plans/beepaws-storefront-design-critique.md` (homepage 30/40, PDP 29/40).

## Theme

Warm, editorial, "elevated cozy" pet-wellness storefront. Light-first; a single dark
closing band per page (bark) as the emotional full-stop. One warm hue family carries almost
every surface, which is both the identity and the current weakness (reads templated; see the
critique's "visuals templated, voice strong").

## Color

Palette lives once in `:root` (raw hex) and is exposed as Tailwind tokens via `@theme inline`.

**Surfaces (light):** `paper #FDF8EC` (page base) · `cream #FBF3E1` · `sand #F2E7CC` ·
`honey-tint #F6E6C6` (bands, tints) · `card #FFFFFF` (cards).
**Warm-dark:** `toffee #E5C58C` (mid band) · `bark #5E3C22` (closing band) · `cocoa #4A2E16`
(headings, deepest ink) · `brown #4A3B2A` (secondary text) · `ink #2A1B0E` (body).
**Accents:** `clay #C56A1E` (brand primary, logo fur) · `gold #E7A92F` / `gold-deep #C8901C`
(CTAs) · `amber #DD8A38`.
**Green (botanical only):** `moss #2F3B2A` · `sage #8CA081` (decorative only, fails AA as text) ·
`positive` → moss. **Line:** `line #EADEC2` hairline. `rose-soft #BC5E38` (gentle alert).

**Green rule (palette pass 2026-07-21).** Green means ONE thing: living / plant-derived. It was
previously a general accent — the footer was deep forest `#15241A`, the last survivor of the
abandoned Forest re-theme, while nothing else on the site was green, so the footer read as
another site's. Green now appears only where the page is literally about plants (ingredient
names + the formula toggle in "What's inside") and as the `positive` signal (free / added /
saved), which is the same green tokenized rather than stray Tailwind `emerald-*`. The **footer
is now `cocoa`**, one step deeper than the `bark` closing band above it, so the page still ends
on a dark full-stop and the footer wave deepens bark → cocoa instead of switching hue. Do not
reintroduce green as a decorative surface.

## Seasonal skins

A season is a small override set on the raw palette (`[data-season="…"]` in `globals.css`),
activated by `lib/theme.ts` (edit the constant, or set `NEXT_PUBLIC_SEASONAL_THEME`) and
rendered onto `<html>` server-side, so there is no flash. Because every component reads tokens,
a season needs zero component changes. Shipped: `default` (Warm Honey, no block), `evergreen`
(winter: spruce closing band, frost-cooled tints, warm gold CTAs kept), `blossom` (spring:
blossom tints, softer brown closing band).

**The rule that keeps it safe:** a season may only move ACCENT and BAND colors. It must never
touch the ink ramp (`ink` / `cocoa` / `brown`), the base surfaces (`paper` / `cream` / `card`),
or `line` — those carry every text contrast pair, so leaving them fixed means a new season
cannot silently break AA. Keep replacement bands in the same lightness neighbourhood.

Strategy today: **Restrained** (tinted-neutral surfaces + gold accent under ~10%), with one
committed color moment where it is earned (green in the botanical section). The visual pass is
still moving toward **Committed** in more places so the page stops relying on the cream body to
carry identity.

Contrast: enforce AA. Watch `brown`/`ink` on `honey-tint`/`sand`; muted body on tinted cream is
the palette's main contrast risk. Verified this pass: moss on toffee 7.1:1, moss on white 11.8:1,
cream on cocoa 11.2:1, `cream/75` on cocoa 7.1:1, `cream/60` on cocoa 5.1:1, gold on cocoa 6.0:1.

## Typography

- **Display:** Fraunces (serif), via `next/font` → `--font-display` / Tailwind `font-display`.
  Used for all headings, pull-quotes, the "30" seal. (Fraunces is on the skill's reflex-reject
  list, but it is a committed brand identity here, so identity-preservation wins.)
- **Body:** Hanken Grotesk (humanist sans) → `--font-body` / `font-sans` (default).
- Headings: semibold Fraunces, tight but not cramped tracking. Body: Hanken, relaxed line-height
  on the warm grounds.
- No per-section uppercase eyebrows (removed in `78b04ab`); keep at most the one hero eyebrow.
- Cap line length ~65–75ch. Two families only; no third.

## Iconography

Lucide, thin stroke (~1.75), in `clay`/`gold`. No large rounded-corner icon tiles stacked above
every heading (template tell). Emoji only inside authored use-case cards' fallback.

## Spacing & Layout

- Container `max-w-7xl`, `px-5 md:px-8`; section vertical rhythm `py-14/16` → `md:py-20/24`.
- Full-width color **bands** stacked vertically; each section is one band. Section-to-section
  color changes use long top-gradients for light↔light seams (each section starts in the previous
  color and warms into its own over ~220px); the light→dark drop is being resolved separately
  (crisp vs wave, in progress).
- Corner radius capped at `rounded-2xl` (16px) on cards/bands after the polish pass (`d6fd7c8`);
  pills stay full-round. Do not exceed.
- Known weakness: rhythm is uniform and card-grid-heavy; the pass should introduce asymmetry,
  varied fold scale, and art direction per section.

## Components

- **Cards:** white, `border border-line`, soft warm shadow (`--elev-shadow-card`), `rounded-2xl`.
  Avoid the 1px-border-plus-wide-shadow "ghost card" doubling; pick one.
- **CTAs:** `bg-gold` → `hover:bg-gold-deep`, `text-cocoa`, `rounded-xl`, press-dip 0.97.
- **Bands:** honey-tint / cream / sand / toffee / bark full-bleed sections.
- **PDP:** hero buy-column distilled to a single add-to-cart goal (cross-sell relocated below);
  before/after is a 2-column drag-reveal; WaveDivider used for the organic "act break" seams.
- **Seals/guarantee:** gold radial "30 day" seal on a paper island in the bark closing band.

## Motion

IntersectionObserver (`components/RevealObserver`) toggles `.is-visible`; content is visible by
default (reveal enhances, never gates). Strong ease-out `--ds-ease-out: cubic-bezier(0.23,1,0.32,1)`.

- `.ds-reveal` fade+rise sections; `.ds-reveal-in` fades a solid-bg section's children only (keeps
  the band/seam painted); `.ds-stagger` opacity-only cascade (~70ms) for grids; `.ds-hero-stagger`
  on-load hero sequence; `.ds-lift` pointer-only hover lift; universal `button:active` scale 0.97.
- Reduced motion: fade-only / none fallbacks throughout.
- Weakness the pass targets: the **uniform fade-up reflex** (one identical entrance on every
  section). Motion should fit what each section reveals, with one orchestrated moment rather than
  a page of identical fades.

## Do-not (project-specific)

- No stock-photo pets in evidentiary slots; real or absent.
- Em dashes ARE intentional in the shipped homepage copy (canonical spec) even though the skill
  bans them generally; do not strip them from `app/page.tsx` visible copy.
- Grooming stays hidden behind `SHOW_GROOMING` until real SKUs exist.
