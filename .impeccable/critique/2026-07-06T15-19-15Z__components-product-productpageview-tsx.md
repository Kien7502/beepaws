---
target: product page (ProductPageView.tsx)
total_score: 30
p0_count: 1
p1_count: 2
timestamp: 2026-07-06T15-19-15Z
slug: components-product-productpageview-tsx
---
# Critique — PDP (components/product/ProductPageView.tsx)

Branch experiment/skill-design-taste, working tree (hero distill + Before/After 2-col included). Code-level review + detector; no browser this run.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | dynamic price, sticky ATC; cart states unverified |
| 2 | Match System / Real World | 3 | voice strong; lorem defaults can reach shoppers |
| 3 | User Control and Freedom | 3 | solid |
| 4 | Consistency and Standards | 3 | seam language diverges from homepage (waves vs gradients) |
| 5 | Error Prevention | 3 | variant availability handled; bundle picker unverified |
| 6 | Recognition Rather Than Recall | 3 | fake link affordance on review count |
| 7 | Flexibility and Efficiency | 3 | sticky ATC + tier picker |
| 8 | Aesthetic and Minimalist Design | 3 | good band rhythm; emoji visuals + card-grid repetition |
| 9 | Error Recovery | 3 | unverified async paths |
| 10 | Help and Documentation | 3 | FAQ + details sections |
| **Total** | | **30/40** | **Good** |

## Anti-Patterns Verdict
Deterministic scan: 0 findings (clean exit). Judgment-level: three identical-card 3-grids (PainPoints, Mechanism steps, UseCases), emoji-as-hero-visual (🤫 in gold ring; 🟡 fallback), animated wave dividers as decorative costume. Mechanism pull-quote `border-l-[3px]` is classic quote styling — borderline, acceptable.

## Priority Issues
- **[P0] UGCReviews DEFAULT_REVIEWS are fabricated testimonials** (names, ratings, like counts, "Verified" badges, $ figures, brand replies) rendered whenever `beepaws.reviews` is empty. Violates the project's own "invented proof is the one unforgivable move" and breaks the lorem-reads-as-unedited convention every other section follows. Fix: replace with obvious lorem placeholders; never render "Verified" on non-real data.
- **[P1] Hero rating row prints literal ★★★★★ regardless of avg**; "N+ pet parents" styled as a link (hover underline) but inert. Fix: render stars from avg; make the count scroll to reviews or unstyle it.
- **[P1] Lorem-ipsum defaults render to real shoppers** on any missing metafield (PainPoints/Mechanism/BeforeAfter/FAQ/Comparison/FinalCTA). Fix: gate unedited sections in production (render null) or add a publish-time check.
- **[P2] UGC marquee ignores prefers-reduced-motion** (JS rAF transform; the global CSS kill can't stop it). Fix: check matchMedia in the effect.
- **[P2] Before/After drag is pointer-only** — no keyboard path for the handle; slide dots ~10px targets. Fix: range-input semantics (arrow keys move pct), bigger dot hit areas.
- **[P2] Seam divergence:** homepage moved to long gradient seams; PDP still runs 3 wave dividers = 9 infinite compositor animations. Unify the seam language (known open item).
- **[P2] UseCase label badge: white 10px text on editor-picked color** (white on #f5a800 ≈ 1.9:1) — no contrast guard on authored colors.

## Persona Red Flags
- Skeptical label-reader (core audience): default reviews smell scripted ($1,400 recurring, unearned "Verified", platform-less like counts) — catastrophic if noticed.
- Casey: 10px slide dots; marquee fights thumb scroll; waves cost battery.
- Jordan: lorem ipsum on an unedited product = instant abandonment.
- Riley: empty-metafield states, inert pseudo-link, star glyph vs avg mismatch.

## Minor Observations
Mini-trust `<br/>` line breaks brittle; off-token hex in Before/After placeholder gradients; buy-column distill is genuinely good decision architecture; vet-bill anchor is strong honest persuasion.

## Questions to Consider
- Is the wave divider the PDP's voice, or leftover costume from the pre-gradient era?
- Should an unedited section render at all in production?
