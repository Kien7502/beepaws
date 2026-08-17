import Link from 'next/link';
import RevealObserver from '@/components/RevealObserver';
import { WaveDivider } from '@/components/ui/WaveDivider';
import NewsletterPopup from '@/components/NewsletterPopup';
import ProofCarousel from '@/components/ProofCarousel';
import { HomeSlotImage } from '@/components/HomeSlotImage';
import { getHomepageBlocks } from '@/lib/shopify/homepage';
import { ShieldCheck, Tag, HandHeart, PawPrint, CalendarCheck, Heart, Search, Shield } from 'lucide-react';

// ISR: revalidate via webhook → revalidateTag("products")
export const revalidate = 3600;

// Palette is the brand Warm Honey system via real @theme tokens (bg-cream /
// paper / card / honey-tint / bark, text-cocoa / brown, bg-clay / gold). The
// page-scoped --ds-* vars from the design experiment are fully retired. Display
// headings use the brand serif (font-display / Fraunces). Forest green lives in
// the footer anchor. Grooming launch is one SHOW_GROOMING flip.

// Grooming category goes live ~2 weeks after dental (blueprint "launch context").
// Flip to true when grooming SKUs are published. Until then the grooming slot is
// hidden entirely - never shown as "coming soon" (blueprint hard rule).
const SHOW_GROOMING = false;

// The four brand pillars (consolidated spec §5). Layout = Option 6, the
// flanked-scene arrangement — CHOSEN 2026-07-09 over row-manifesto Option 3
// and card-grid Option 5 (both deleted with the ?variant switch). Pillar 4
// body swaps on SHOW_GROOMING.
const PILLARS = [
  { icon: ShieldCheck, title: "Honest about what it does", body: "Results in weeks, not overnight. Quiet, not silent. We tell you what this does — and what it doesn't." },
  { icon: Tag, title: "Read-the-label transparency", body: "Every ingredient in plain English. Xylitol-free, and cat-safe wherever the label says so." },
  { icon: HandHeart, title: "She decides what touches her pet", body: "You read the label and keep your pet healthy on your own terms. We make tools for that, not shortcuts that ask you to hand your pet to a stranger." },
  {
    icon: PawPrint,
    title: "Made for the pet you actually have",
    body: SHOW_GROOMING
      ? "Small breeds. Senior pets. Anxious dogs. Long-haired cats with spicy opinions about brushes. Real names, real breeds, real photos — never stock fur."
      : "Small breeds. Senior pets. Anxious dogs. Cats whose mouths have been quietly ignored. Real names, real breeds, real photos — never stock fur.",
  },
] as const;

// The four at-home-wellness principles in §3 ("Healthy pets start at home").
const PRINCIPLES = [
  { icon: CalendarCheck, title: "Consistency beats intensity", body: "A little, often, beats a big production once in a while. The routines that work are the ones small enough to actually keep." },
  { icon: Heart, title: "Calm matters", body: "A calm pet lets you do more, and a calm routine is one you will not quit. Stress is what makes people give up halfway." },
  { icon: Search, title: "You catch things early", body: "Handle your pet regularly and you notice the sore gum, the lump, the limp while it is still small and cheap to fix." },
  { icon: Shield, title: "Prevention over treatment", body: "The kindest, cheapest fix is the one that stops a problem before it ever becomes a vet visit." },
] as const;

// No searchParams read: the ?variant pillar switch and the ?ground palette
// experiment are both retired (Option 6 + the default Warm Honey ground won,
// 2026-07-09), so the page statically renders again and the ISR revalidate
// above is live. A palette review, if ever wanted, is a deliberate later pass.
export default async function Home() {
  // Admin-authored image blocks (docs/admin-handoff-homepage.md), keyed by slot.
  // Absent/empty metafield → {} → every slot falls back to its hardcoded
  // placeholder + copy below, so the page renders identically to before until
  // the owner publishes. Keys consumed: see HOMEPAGE_KEYS in lib/shopify/homepage.
  const blocks = await getHomepageBlocks();
  return (
    <div className="flex w-full flex-col bg-cream text-cocoa [font-family:var(--font-body)]">
      {/* Scroll-reveal driver + no-JS fallback so content is never hidden */}
      <RevealObserver />
      {/* Scroll-triggered newsletter popup (replaces the inline newsletter section) */}
      <NewsletterPopup />
      <noscript
        dangerouslySetInnerHTML={{
          __html: '<style>.ds-reveal,.ds-stagger>*{opacity:1!important;transform:none!important}</style>',
        }}
      />

      {/* ───── Section 2 · Hero - full-bleed banner (consolidated spec §2) ─────────
          Editorial lifestyle banner (NOT two-column - that read as product-
          marketing): a full-bleed warm SCENE (pet in lap, no product) with
          overlaid text + a warm scrim for legibility. CTA "Start now" is
          category-neutral and PERMANENT (no grooming swap). No trust strip (it
          duplicated the shipping bar + Promise). Real Warm Honey tokens. */}
      <section className="relative min-h-[min(86dvh,800px)] w-full overflow-hidden">
        {/* Full-bleed lifestyle SCENE. Illustrative (AI ok later); NO product, NO
            stock fur close-up. Filled by the `hero` block when published, else
            the placeholder ground. */}
        <div className="absolute inset-0 flex items-center justify-center bg-honey-tint">
          <HomeSlotImage block={blocks.hero} sizes="100vw" priority>
            <span className="text-xs font-semibold uppercase tracking-wider text-brown/50">Lifestyle scene (full-bleed)</span>
          </HomeSlotImage>
        </div>
        {/* Warm scrim, heavier on the left where the copy sits, for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-cocoa/85 via-cocoa/45 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[min(86dvh,800px)] max-w-7xl flex-col justify-center px-5 py-20 md:px-8">
          <div className="ds-hero-stagger max-w-xl">
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
              At-home pet wellness · no hype
            </span>
            {/* The hard break only helps once the line fits whole (≥md); on a
                narrow phone it stacked with natural wrapping into ragged 3-4
                line output, so let mobile wrap on its own. */}
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {blocks.hero?.heading ? (
                <span className="whitespace-pre-line">{blocks.hero.heading}</span>
              ) : (
                <>Keep your pet healthy,<br className="hidden md:inline" /> on your own terms.</>
              )}
            </h1>
            <p className="mt-5 max-w-md whitespace-pre-line text-lg leading-relaxed text-white/85">
              {blocks.hero?.body ??
                "Honest tools for the care you would rather do at home. We don’t claim to replace your vet — just to keep you out of the chair for the easy stuff."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={blocks.hero?.ctaHref ?? "/collections/all"}
                className="inline-flex h-14 items-center justify-center rounded-full bg-clay px-9 text-base font-bold text-white shadow-lg transition-colors duration-200 hover:bg-cocoa active:scale-[0.97]"
              >
                {blocks.hero?.ctaLabel ?? "Start now"}
              </Link>
              <Link
                href="#why"
                className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/40 px-9 text-base font-bold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/10 active:scale-[0.97]"
              >
                Why BeePaws
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Section 3 · Healthy pets start at home (consolidated spec §3) ───────
          LEADS the page: converts the "is at-home care even legit?" skeptic before
          the product. 2-zone: a WIDER warm outcome image (illustrative) + 2x2 grid
          of four wellness principles. Persuasion copy (DRAFT, voice pass). */}
      {/* Hairline top: the hero's placeholder ground is honey-tint too, so
          without it hero and §3 fused into one band (interim issue — the real
          hero photo will separate them naturally; the hairline stays correct
          either way). */}
      <section className="border-t border-line bg-honey-tint">
        <div className="ds-reveal mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[55fr_45fr] md:gap-14 md:px-8 md:py-24">
          {/* Left: warm outcome image (illustrative; AI ok later; no attribution) */}
          {/* min-h 240 on phones (was 300): a full-width empty box was eating
              most of a mobile screen before any words arrived. */}
          <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl bg-cream md:min-h-[440px]">
            <HomeSlotImage block={blocks['healthy-home']} sizes="(max-width: 768px) 100vw, 55vw">
              <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Warm outcome scene</span>
            </HomeSlotImage>
          </div>
          {/* Right: the argument (must convert the skeptic, not just list nice ideas) */}
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
              {blocks['healthy-home']?.heading ?? "Healthy pets start at home"}
            </h2>
            <p className="mt-3 max-w-xl whitespace-pre-line text-brown">
              {blocks['healthy-home']?.body ??
                "The vet is for the big stuff. Most of what keeps a pet healthy is small, regular, and yours to do."}
            </p>
            {/* De-carded blocks: no card backgrounds, so the four read as
                considered points separated by space rather than a template card
                grid (kept distinct from the full-width Why-BeePaws bands below). */}
            {/* Mobile: icon-beside-text rows — four stacked icon-on-top blocks
                read as a long pale wall on phones (mobile rework 2026-07-10,
                PHERO-reference rhythm). ≥sm the icon returns above the title. */}
            <div className="ds-stagger mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 sm:gap-y-7">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="flex gap-3.5 sm:block">
                  <p.icon size={24} strokeWidth={1.75} className="mt-0.5 shrink-0 text-clay sm:mt-0" />
                  <div>
                    <h3 className="font-display text-lg font-semibold text-cocoa sm:mt-3">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-brown">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Section 4 · Why BeePaws - brand pillars (consolidated spec §5;
          Option 6 flanked-scene layout). MOVED UP (flow rework 2026-07-10):
          the page is now brand-first — pitch → identity → evidence → action —
          so the pillars follow the at-home argument, the reviews prove them,
          and the product spotlight closes the page as the exit ramp into the
          PDP. bg-sand (was bg-card): plain white read "too bright" against
          the warm page. Pillar 4 body swaps on SHOW_GROOMING. */}
      <section id="why" className="bg-sand scroll-mt-24">
        {/* max-w-6xl: the 3-column flank layout needs the extra width. */}
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <h2 className="ds-reveal font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
            Why BeePaws
          </h2>
          <p className="ds-reveal mt-3 max-w-xl text-brown">
            Plain-spoken about what our tools do, and what they do not.
          </p>
          {/* Option 6 — CHOSEN 2026-07-09 (beat row-manifesto Option 3 and
              card-grid Option 5; both deleted with the ?variant switch).
              Shrine-inspired benefits-flank-a-photo: two de-carded pillars
              each side of a CENTRAL WARM SCENE — the pattern's engine is an
              emotional image in the center (ILLUSTRATIVE slot: AI ok,
              quality-inspected; never evidentiary), which is why Option 5's
              logo-center never landed. Mobile: heading → image → pillars
              stacked (DOM order: image first).

              Layout: ONE 2×3 grid — the scene spans both rows in the center
              column, pillars sit in the four corner cells, so both sides
              share row heights and stay symmetric regardless of copy length.
              Center column gets the LARGEST share so the scene dominates.
              items-start: row-mates align at their TOPS — center-alignment
              staggers the titles when copy lengths differ. */}
          <div className="ds-reveal mt-12 grid items-start gap-x-8 gap-y-10 md:grid-cols-[4fr_5fr_4fr] md:grid-rows-2 lg:gap-x-12">
            {/* cream + hairline (was borderless honey-tint): on the sand band
                the honey placeholder all but vanished; the border stays right
                once the real photo fills the slot. */}
            {/* Mobile (rework 2026-07-10): the scene shortens (16/10) and
                SANDWICHES between pillar pairs (order-2) instead of parking a
                tall empty box before all the text — PHERO's mobile rhythm.
                Desktop 2×3 corner-cell layout unchanged. */}
            <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl border border-line bg-cream max-md:order-2 md:col-start-2 md:row-start-1 md:row-span-2 md:aspect-[3/4]">
              {/* Central illustrative scene — the engine of the Option-6 flank
                  layout. Filled by the `why-scene` block when published. */}
              <HomeSlotImage block={blocks['why-scene']} sizes="(max-width: 768px) 100vw, 40vw">
                <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Warm scene (illustrative)</span>
              </HomeSlotImage>
            </div>
            {PILLARS.map((p, i) => (
              <article
                key={p.title}
                className={`flex gap-3.5 md:block ${
                  [
                    "max-md:order-1 md:col-start-1 md:row-start-1",
                    "max-md:order-1 md:col-start-1 md:row-start-2",
                    "max-md:order-3 md:col-start-3 md:row-start-1",
                    "max-md:order-3 md:col-start-3 md:row-start-2",
                  ][i]
                }`}
              >
                <p.icon size={26} strokeWidth={1.75} className="mt-0.5 shrink-0 text-clay md:mt-0" />
                <div>
                  <h3 className="font-display text-xl font-semibold text-cocoa md:mt-3">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-brown">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WAVE PAIR — the proof band is ENCLOSED by waves (opened here, closed
          below) and the band is BARK: the light ramp (cream/honey/sand) is too
          compressed for another pale band to register — the page needs a
          second COMMITTED surface (palette rework 2026-07-10, PHERO-reference
          strategy: quiet bands alternating with drenched ones). Dark proof =
          white testimonial cards pop hardest, the waves bridge a maximal
          lightness step, and the page regains the mid-page dark anchor it
          lost when the promise band was cut. */}
      <WaveDivider from="#F2E7CC" to="#5E3C22" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
      {/* ───── Section 5 · Real proof - testimonials (consolidated spec §6) ───────
          Flow rework 2026-07-10: proof FOLLOWS the pillars (brand-first page:
          pitch → identity → evidence → action) — the reviews prove the pillar
          claims, then the product spotlight closes the page. Path B
          (testimonial-led): photo is the hero of each card, THREE large cards
          in a row, breed-matched attribution. Photos MUST be real
          customer-and-pet shots with permission - NEVER stock. Quotes are
          brand-experience draft. Path A (guarantee-forward + founder note) is
          a later funnel A/B - see the founder-note placeholder below. */}
      <section className="bg-bark">
        <div className="ds-reveal mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cream md:text-[2.6rem]">
            Real pets. Real moms. Real photos.
          </h2>
          {/* Mobile: STAGED carousel with explicit prev/next + dot buttons
              (owner decision 2026-07-10 — swipe misfired: accidental scrolls,
              wet hands). Card markup + controls live in ProofCarousel;
              ≥md it's the same 3-up grid as before. */}
          {/* Photos + first names come from the proof-1/2/3 blocks when
              published; the quote/breed fall back to the drafted defaults.
              A published block's body overrides the quote, its heading the name. */}
          <ProofCarousel
            quotes={[
              { quote: blocks['proof-1']?.body ?? "I never thought I'd be the kind of person who does this at home. Turns out I am, and I like it.", breed: "Goldendoodle mom", image: blocks['proof-1']?.image, alt: blocks['proof-1']?.alt, name: blocks['proof-1']?.heading },
              { quote: blocks['proof-2']?.body ?? "I read every label before it goes near my pet. This is the first one I didn't put back.", breed: "Senior terrier mom", image: blocks['proof-2']?.image, alt: blocks['proof-2']?.alt, name: blocks['proof-2']?.heading },
              { quote: blocks['proof-3']?.body ?? "No vet-office stress, no wrestling. We just do it on the couch now.", breed: "Cat mom", image: blocks['proof-3']?.image, alt: blocks['proof-3']?.alt, name: blocks['proof-3']?.heading },
            ]}
          />
          <p className="mt-6 text-xs text-cream/70">
            Placeholder proof. Replace with three real customer-and-pet photos (permission given) and verified, brand-experience testimonials before launch. Never stock.
          </p>
        </div>
      </section>
      </div>

      {/* ───── Founder note - DEFERRED (Path A only, consolidated spec §7) ─────
          Not built: Path B (chosen for launch) has no founder note, and Path A
          needs a REAL founder photo + statement (never AI). When testing Path A,
          add here a bg-cream band: real founder photo + name + 2-3 honest
          sentences on why BeePaws exists and starts small. Stays proof-adjacent
          after the §5↔§6 swap. */}

      {/* WAVE — bark → cream: closes the dark proof band into the spotlight. */}
      <WaveDivider from="#5E3C22" to="#FBF3E1" flip />

      {/* ───── Section 6 · Routing band - "Start with their teeth" (spec §4) ──────
          MOVED TO THE CLOSE (flow rework 2026-07-10): the spotlight is the
          page's action moment — the exit ramp into the PDP funnel — after the
          brand has argued (pillars) and proven (reviews) its case. The 30-day
          promise band was CUT as redundant with the PDP's full guarantee +
          inoculation treatment; risk reversal survives as the trust line under
          the CTA, present at the moment of action. Grooming slot hidden
          (SHOW_GROOMING) until live - never "coming soon". DRAFT - voice pass. */}
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
      <section className="bg-cream">
        <div className="ds-reveal mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
          {/* Heading reframes dental-only as a deliberate sequencing choice at
              launch; reverts to the multi-category promise when grooming is live. */}
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
            {SHOW_GROOMING ? "Shop by what your pet needs" : "Start with their teeth"}
          </h2>
          {!SHOW_GROOMING && (
            <p className="mb-10 mt-3 max-w-xl text-brown">
              We start with what we make today, and add categories only when they&rsquo;re ready.
            </p>
          )}
          {!SHOW_GROOMING ? (
            /* Launch: a single dental product spotlight (60/40) earns the full
               width. The price-anchor line (voice principle 4) makes it read as a
               real spotlight, not a placeholder card. Real product photo needed. */
            <article className="ds-lift grid overflow-hidden rounded-2xl border border-line bg-card shadow-[var(--elev-shadow-card)] md:grid-cols-5">
              <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-honey-tint md:col-span-3 md:min-h-[380px]">
                {/* Real OUTCOME photo — a happy, relaxed pet (pink gums as part of a
                    natural expression, NOT a clinical teeth shot). Filled by the
                    `dental-spotlight` block; placeholder otherwise. No stock. */}
                <HomeSlotImage block={blocks['dental-spotlight']} sizes="(max-width: 768px) 100vw, 45vw">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Outcome photo (happy pet)</span>
                </HomeSlotImage>
              </div>
              <div className="flex flex-col justify-center p-8 md:col-span-2 md:p-10">
                <h3 className="font-display text-3xl font-semibold text-cocoa">
                  {blocks['dental-spotlight']?.heading ?? "Dental"}
                </h3>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-brown">
                  {blocks['dental-spotlight']?.body ??
                    "Pearly whites, pink gums, fresh breath — without the anesthesia."}
                </p>
                <p className="mt-4 font-display text-xl font-bold text-clay">
                  A $40 device, or a $1,400 vet bill.
                </p>
                {/* TODO: confirm real specs */}
                {/* Solid brown: /70 sat at ~4.2:1 on cream — under AA for 14px. */}
                <p className="mt-2 text-sm text-brown">Ultrasonic · cordless · USB-C · 3 cleaning modes</p>
                <Link
                  href={blocks['dental-spotlight']?.ctaHref ?? "/collections/all"}
                  className="mt-6 inline-flex h-12 w-fit items-center rounded-full bg-clay px-6 font-bold text-white transition-colors hover:bg-cocoa active:scale-[0.97]"
                >
                  {blocks['dental-spotlight']?.ctaLabel ?? "Shop dental"}
                </Link>
                {/* Risk reversal at the action moment — the promise band was
                    cut as redundant with the PDP; the guarantee still shows
                    where the click happens. */}
                <p className="mt-4 text-xs font-semibold text-brown">
                  30-day money-back guarantee · Free shipping over $50
                </p>
              </div>
            </article>
          ) : (
            /* Grooming launch: revert to the blueprint's two-card grid. */
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="ds-lift overflow-hidden rounded-2xl border border-line bg-card shadow-[var(--elev-shadow-card)]">
                <div className="flex aspect-[16/10] items-center justify-center bg-honey-tint">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Dental photo</span>
                </div>
                <div className="p-7">
                  <h3 className="font-display text-2xl font-semibold text-cocoa">Dental</h3>
                  <p className="mt-2 leading-relaxed text-brown">
                    Pearly whites, pink gums, fresh breath — without the anesthesia.
                  </p>
                  <p className="mt-3 font-semibold text-clay">A $40 device, or a $1,400 vet bill.</p>
                  <Link
                    href="/collections/all"
                    className="mt-5 inline-flex h-12 items-center rounded-full bg-clay px-6 font-bold text-white transition-colors hover:bg-cocoa active:scale-[0.97]"
                  >
                    Shop dental
                  </Link>
                </div>
              </article>
              <article className="ds-lift overflow-hidden rounded-2xl border border-line bg-card shadow-[var(--elev-shadow-card)]">
                <div className="flex aspect-[16/10] items-center justify-center bg-honey-tint">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Grooming photo</span>
                </div>
                <div className="p-7">
                  <h3 className="font-display text-2xl font-semibold text-cocoa">Grooming</h3>
                  <p className="mt-2 leading-relaxed text-brown">
                    Quiet tools, calm pets, done at home. Trimmers sized for the pet you actually have.
                  </p>
                  <p className="mt-3 font-semibold text-clay">Less than one professional groomer trip. Once.</p>
                  <Link
                    href="/collections/all"
                    className="mt-5 inline-flex h-12 items-center rounded-full bg-clay px-6 font-bold text-white transition-colors hover:bg-cocoa active:scale-[0.97]"
                  >
                    Shop grooming
                  </Link>
                </div>
              </article>
            </div>
          )}
        </div>
      </section>
      </div>

      {/* ───── Promise band REMOVED (flow rework 2026-07-10) ──────────────────
          The 30-day guarantee + "what we won't do" inoculation live in full on
          the PDP (FinalCTASection); keeping a twin band here was redundant.
          Risk reversal stays present at the homepage's action moment as the
          trust line under the spotlight CTA above. The page now closes on the
          spotlight (cream) → footer wave; Footer's cap is route-aware again. */}

      {/* Inline newsletter section removed (consolidated spec): the passive footer
          subscribe stays; active capture is the scroll-triggered popup below. */}
    </div>
  );
}
