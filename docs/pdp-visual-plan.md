# Product page — visual sweep and running plan (2026-10-10)

A quick sweep of `/products/beepaws-ultrasonic-plaque-remover` at phone (390px)
and desktop (1280px) widths, after the apple-design gesture pass. Screenshots
plus a measured audit (text styles in use, contrast, tap targets, line length).
Work through it one item at a time; the owner judges each in the preview.

**Overall:** the page holds together — palette, section rhythm, the wave
dividers, the cards and the FAQ are consistent. Nothing needs a wholesale colour
or layout change. The findings are mostly small craft fixes.

## Done (apple-design pass, branch `experiment/apple-design`)

- ✓ Swipe follows the finger and lands with a spring — gallery, card sliders,
  comparison table (`63601ba`). Owner: "very good, snappy, and smooth".
- ✓ Before/after divider: scroll-safe, glides, grabbable knob (`d1e21d5`).

- ✓ Press feedback on link buttons (`f271b20`, 2026-10-11): a shared `pressable`
  utility in `globals.css` gives links styled as buttons the same 0.97 dip as
  real buttons — listicle buttons + floating pill, cart/thank-you links, the
  More-from rows, error pages; the homepage's one-off copies use it too.
  Verified with a mouse press; touch needs a real phone (headless Chrome can't
  drive touch `:active`, for buttons either).

## Next

1. *(was press feedback — done, see above)*

## Found in the sweep — quick fixes

2. ✓ **Sticky add-to-cart bar mirrors the buy box** (`52d577b`, 2026-10-11,
   owner chose mirroring over scrolling back). It used to add the first colour
   alone at the base price whatever was picked; now it shows the buy box's
   kit, colours and total and runs the same add (`BuyBoxSync`). Verified by
   capturing the cart requests: bar and main button send identical lines.
   Prices on the page are whatever Shopify holds — the source of truth is the
   admin's `docs/beepaws-pdp-revision-2026-10-05.md` (device $49.95, kits
   $49.95 / $59.95 / $109.95, spray $20) once the owner updates the store.
3. ✓ **Tap targets** (2026-10-11): slider dots are 24×40px buttons with the
   small dot drawn inside; arrows 40px; footer links fill their gaps; social
   icons 38px and named for screen readers. Follow-up 2026-10-13: in the tier
   cards, the row for the page's OWN product is plain text now (its link only
   reopened this page in a new tab — the likeliest accidental tap inside the
   selectable card); other products keep a link with a 26px hit area (was 16).
4. ✓ **Low-contrast text** (2026-10-13; WCAG AA: 4.5:1 small text, 3:1 large).
   Re-measured from rendered colours first (the sweep's numbers held). Two new
   tokens, same hues, for SMALL TEXT only — `--clay-deep #9E4F17` and
   `--rose-deep #A44E2C`; brand clay stays for shapes, borders, icons. Both pass
   on the seasonal honey/toffee variants too.
   - hero pill: clay → clay-deep, 3.13 → 4.76
   - use-case badges: ONE colour for every card now — white on clay-deep, 5.86
     (the amber card's white badge was 2.0). Owner tried dark text on the amber
     (harder to read) and a deepened amber (too pale), picked clay-deep, then
     asked for all three badges to match. Card colours still drive the
     gradient and the title rule.
   - "brushing harder" (`withAccent`, toffee band, large): clay → clay-deep, 2.33 → 3.54
   - comparison text cells: clay → clay-deep (3.46 → 5.27), rose → rose-deep (4.38 → 5.67)
   - pain-point numbers: gold-deep → clay-deep, 2.29 → 4.76
   Content, same day: comparison "$45" → "Under $50" (revision doc; pushed). The
   final CTA's "From $X" is computed from the device price — already "From $50".
5. ✓ **Justified text on phones** (2026-10-13). The Canine Saliva Paradox
   paragraphs are justified and hyphenated; on a phone's narrow column that left
   uneven gaps and split words ("en-zyme", "be-gins"). Now left-aligned with no
   hyphenation below `md`; justified + hyphenated from `md` up, as before.
6. ✓ **One-word last lines** (2026-10-13). Measured 10 on a phone, 3 on desktop
   ("…at 2 / a.m.", "…the hard / stuff."). One base rule in `globals.css`:
   `text-wrap: pretty` on h1–h4, p, li, blockquote → 1 and 0. Not `balance`: it
   shortens lines (the H1 lesson) and would break "before-and- / after" in the
   one heading left ("…speak for / themselves" on phones — kept, owner OK'd).
   Follow-up: `pretty` then broke hyphenated words at the hyphen on phones
   ("30- / day", "no- / questions"; owner: looks weird) → `keepHyphenated()` in
   `lib/inline-format.tsx` keeps them whole (tier descriptions, final-CTA small
   print, pain-point cards, and inside withBold/withAccent). Measured 0 splits at
   both widths — "per-tooth" on desktop, which split before this item too, included.
7. ✓ **Over-long lines → callout REMOVED** (2026-10-13). The dark "Read this
   before your first use" callout ran ~130 characters per line on desktop. A
   heading-beside-body layout (~65/line) looked odd to the owner, and the box only
   repeated the buy box's short note ("You won't hear or feel a thing…"), which the
   instruction email (arrives on delivery day) covers too — so it's gone, with its
   `mechanism_callout` field (admin) and the legacy `feelsBroken*` fallbacks.
   **Revisit (owner):** How it works now ends on the step slider and "feels a bit
   hanging" — look again during the owner's full-page pass.

## Lighter page colour — DONE (owner, 2026-10-14)

Tested on the PDP with screenshots (now vs one step lighter, phone + desktop) and kept,
site-wide: `--paper` #FDF8EC → **#FEFBF5** (the listicle's page), `--cream` #FBF3E1 →
**#FDF8EC**; each tone moved up one step, so neighbouring bands keep their contrast. The
PDP's and homepage's cream waves now read `var(--cream)` instead of a hex. The listicle's
boxes keep the old cream as `--cream-deep` (#FBF3E1) so they still stand out on its page.
Toffee, sand (FAQ), honey and the dark bands are unchanged — the owner can still ask for the
FAQ band one step lighter (it now reads as the darkest light band).

## Bigger tidy — later

8. **Type scale — DONE (owner, 2026-10-14).** Ten named roles
   (`type-*`, see DESIGN.md → Typography) applied to every section and the hero: 51 → 37
   styles and 18 → 14 sizes on phones, all 10 section headings one style. Owner: "mostly
   looks the same, which is good"; the paradox read spaced out at the body role's 16px, so
   it uses the card role (15px). Buy box converted the same afternoon (kit names 15,
   descriptions + contents 13, pills 11): the page ends at 30 styles / 12 sizes on phones,
   no half-pixel sizes. The trust line's dots now ride on the item before them, so a wrapped
   line never starts with "·".
   Original note: 50 distinct text styles on the page, including half-pixel
   sizes (12.5, 13.5, 14.5, 15.5, 16.5px), and same-size headings with different
   tracking (30px "You smelled it first…" is tightened, 30px "Your vet's $1,400
   quote…" isn't). Consolidate to ~8 sizes with one tracking + leading per size
   (apple-design §15: tighter tracking as type grows, hierarchy from weight +
   size + leading together). Best done after the 10-05 copy revision lands.

## Content noticed along the way (not visual)

9. ✓ Brand spelling (2026-10-13): the spray's Shopify title is fixed (owner);
   in code every stand-alone "Beepaws" → "BeePaws" — page titles + descriptions,
   share-card site name, JSON-LD brand/seller, logo alts, footer ©, homepage
   copy (27 in 13 files; code names like `BeepawsMetafields` untouched). The
   default tab title "Beepaws | Pet E-commerce" (scaffold text) → "BeePaws".
10. ✓ Footer social icons (2026-10-13): the links went to bare instagram.com /
   facebook.com / twitter.com, so they're HIDDEN until real URLs are filled into
   `SOCIAL` in Footer.tsx (an empty url hides its icon); the bird is the X mark.
11. 30-day → 60-day guarantee and the shipping wording are already in the owner's
    10-05 PDP revision list (buy box, guarantee box, FAQ, footer strip).
