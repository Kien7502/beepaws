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

2. **The sticky add-to-cart bar ignores the shopper's choice.** It always adds
   the FIRST colour (White) as a single device at $44.95 — while the buy box
   defaults to the Complete Care Kit at $74.90. A shopper who picked Pink and the
   kit, then used the floating bar, gets a white device alone. It should mirror
   the buy box (same item, same price as its button), or scroll back to it.
   (`StickyAddToCart.tsx` uses `product.variants.edges[0]`.) Not covered by the
   10-05 revision doc, which only changes the main button's price.
3. **Tiny tap targets.** The slider dots are 8×8px (pain points, mechanism, use
   cases, comparison) — Apple's minimum is 44px. Give them a ~40px hit area with
   the dot staying small (the before/after dots already do this). The inline
   arrows are 32px (→ 40px). Footer links are 19px tall on phones.
4. **Low-contrast text** (WCAG AA wants 4.5:1 for small text, 3:1 for large):
   - hero pill "VET-GRADE TECHNOLOGY · AT HOME" — clay on honey, **3.1:1** at 12px
   - use-case badges "STRESS-FREE" etc. — white on amber, **2.0:1** at 10px
   - "**brushing harder**" accent — clay on the honey band, **2.3:1** at 30px
   - comparison "$45" — clay on cream, **3.5:1**; "$500–$1,400+" rose on white 4.4:1
   - pain-point numbers 01/02/03 — gold on honey, 2.3:1 (decorative, lowest priority)
   Fix with the existing palette: a deeper clay/brown for small text on honey,
   dark text on the amber badges.
5. **Justified text on phones.** The Canine Saliva Paradox paragraphs are
   justified and hyphenated; on a phone's narrow column that leaves uneven gaps
   and split words ("en-zyme", "be-gins"). Left-align below `md`.
6. **One-word last lines.** Centred leads end with a lone word ("…at 2 / a.m.",
   "…the hard / stuff.", the comparison heading's "tried"). One CSS rule:
   `text-wrap: balance` on headings and short leads, `pretty` on paragraphs.
7. **Over-long lines.** The dark "Read this before your first use" callout runs
   ~118 characters per line on desktop (comfortable is 60–80). Cap its width.

## Bigger tidy — later

8. **Type scale.** 50 distinct text styles on the page, including half-pixel
   sizes (12.5, 13.5, 14.5, 15.5, 16.5px), and same-size headings with different
   tracking (30px "You smelled it first…" is tightened, 30px "Your vet's $1,400
   quote…" isn't). Consolidate to ~8 sizes with one tracking + leading per size
   (apple-design §15: tighter tracking as type grows, hierarchy from weight +
   size + leading together). Best done after the 10-05 copy revision lands.

## Content noticed along the way (not visual)

9. Brand spelling: the spray's Shopify title is "**Beepaws** Dental Spray"
   (shows in the kit rows), and the footer says "© 2026 **Beepaws**" — both
   should be "BeePaws".
10. Footer social icons: the Twitter bird (now X) — and are the links real yet?
11. 30-day → 60-day guarantee and the shipping wording are already in the owner's
    10-05 PDP revision list (buy box, guarantee box, FAQ, footer strip).
