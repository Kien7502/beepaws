import Link from 'next/link';
import Image from 'next/image';
import RevealObserver from '@/components/RevealObserver';
import NewsletterPopup from '@/components/NewsletterPopup';
import { ShieldCheck, Tag, HandHeart, PawPrint, CalendarCheck, Heart, Search, Shield } from 'lucide-react';
import type { CSSProperties } from 'react';

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

// The four brand pillars (consolidated spec §5). Copy + icons stay CONSTANT
// across every layout variant; only the arrangement changes. Pillar 4 body swaps
// on SHOW_GROOMING. Shared by Option 3 (shipped default) and the experimental
// Option 5 (?variant=5).
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; ground?: string }>;
}) {
  // Temporary eval switch: ?variant=5 renders the experimental pillar layout
  // (Option 5) to compare against the shipped Option 3. Remove once a variant is
  // chosen. (Reading searchParams opts this page into dynamic rendering.)
  const { variant, ground } = await searchParams;
  const pillarVariant = variant === "5" ? 5 : variant === "6" ? 6 : 3;

  // Option-3 ground prototype (compare on the homepage only). Overrides the RAW
  // Warm Honey surface tokens on the page wrapper, so every bg-cream / paper /
  // honey-tint / sand / card / line utility on the homepage re-skins to the new
  // ground, while warm accents (clay/gold), ink (cocoa/brown), and the dark bark
  // band stay put. Header / footer / PDP are outside this wrapper, so they're
  // untouched until a ground wins and gets promoted into globals.css :root.
  //   ?ground=clean — refined near-neutral off-white (the "Refined light" option)
  //   ?ground=sage  — soft brand-tinted sage off-white (the "Brand-tinted" option)
  const GROUNDS: Record<string, Record<string, string>> = {
    clean: {
      "--paper": "#FAF9F6", "--cream": "#F4F3EE", "--honey-tint": "#EAE7DF",
      "--sand": "#E4E0D6", "--card": "#FFFFFF", "--line": "#E5E2D9",
    },
    sage: {
      "--paper": "#F5F7F2", "--cream": "#EDF0E9", "--honey-tint": "#E2E8DC",
      "--sand": "#DAE1D3", "--card": "#FBFCFA", "--line": "#DCE1D5",
    },
  };
  const groundVars = ground ? GROUNDS[ground] : undefined;
  return (
    <div className="flex w-full flex-col bg-cream text-cocoa [font-family:var(--font-body)]" style={groundVars as CSSProperties | undefined}>
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
            stock fur close-up. TODO: real warm at-home scene (pet in lap, hands). */}
        <div className="absolute inset-0 flex items-center justify-center bg-honey-tint">
          <span className="text-xs font-semibold uppercase tracking-wider text-brown/50">Lifestyle scene (full-bleed)</span>
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
              Keep your pet healthy,<br className="hidden md:inline" /> on your own terms.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/85">
              Honest tools for the care you would rather do at home. We don&rsquo;t claim to replace your vet — just to keep you out of the chair for the easy stuff.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/collections/all"
                className="inline-flex h-14 items-center justify-center rounded-full bg-clay px-9 text-base font-bold text-white shadow-lg transition-colors duration-200 hover:bg-cocoa active:scale-[0.97]"
              >
                Start now
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
      <section className="bg-honey-tint">
        <div className="ds-reveal mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[55fr_45fr] md:gap-14 md:px-8 md:py-24">
          {/* Left: warm outcome image (illustrative; AI ok later; no attribution) */}
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-cream md:min-h-[440px]">
            <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Warm outcome scene</span>
          </div>
          {/* Right: the argument (must convert the skeptic, not just list nice ideas) */}
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
              Healthy pets start at home
            </h2>
            <p className="mt-3 max-w-xl text-brown">
              The vet is for the big stuff. Most of what keeps a pet healthy is small, regular, and yours to do.
            </p>
            {/* De-carded blocks: no card backgrounds, so the four read as
                considered points separated by space rather than a template card
                grid (kept distinct from the full-width Why-BeePaws bands below). */}
            <div className="ds-stagger mt-8 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <div key={p.title}>
                  <p.icon size={24} strokeWidth={1.75} className="text-clay" />
                  <h3 className="mt-3 font-display text-lg font-semibold text-cocoa">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-brown">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Section 4 · Routing band - "Start with their teeth" (spec §4) ──────
          Full-width dental outcome spotlight. Grooming slot hidden (SHOW_GROOMING)
          until live - never "coming soon". The sub-line carries the honest-
          sequencing message the cut 5.5 section used to hold. DRAFT - voice pass. */}
      <section className="bg-cream">
        <div className="ds-reveal mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
          {/* Heading reframes dental-only as a deliberate sequencing choice at
              launch; reverts to the multi-category promise when grooming is live. */}
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.4rem]">
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
              <div className="relative flex min-h-[260px] items-center justify-center bg-honey-tint md:col-span-3 md:min-h-[380px]">
                {/* TODO: real OUTCOME photo - a happy, relaxed pet (pink gums as part of a
                    natural expression, NOT a clinical teeth shot). No stock. */}
                <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Outcome photo (happy pet)</span>
              </div>
              <div className="flex flex-col justify-center p-8 md:col-span-2 md:p-10">
                <h3 className="font-display text-3xl font-semibold text-cocoa">Dental</h3>
                <p className="mt-3 leading-relaxed text-brown">
                  Pearly whites, pink gums, fresh breath — without the anesthesia.
                </p>
                <p className="mt-4 font-display text-xl font-bold text-clay">
                  A $40 device, or a $1,400 vet bill.
                </p>
                {/* TODO: confirm real specs */}
                <p className="mt-2 text-sm text-brown/70">Ultrasonic · cordless · USB-C · 3 cleaning modes</p>
                <Link
                  href="/collections/all"
                  className="mt-6 inline-flex h-12 w-fit items-center rounded-full bg-clay px-6 font-bold text-white transition-colors hover:bg-cocoa active:scale-[0.97]"
                >
                  Shop dental
                </Link>
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

      {/* ───── Section 5 · Why BeePaws - brand pillars (consolidated spec §5) ──────
          EQUAL-WEIGHT manifesto (Option 3, horizontal bands) - fixes the prior
          pillar-3 feature-cell hierarchy bug. Four pillars, same size; copy + icons
          constant. (Spec wants sibling layout variants A/B'd later; this is the
          recommended default.) Pillar 4 body swaps on SHOW_GROOMING. */}
      <section id="why" className="bg-card scroll-mt-24">
        {/* Option 6 needs the extra width for its 3-column flank layout. */}
        <div className={`mx-auto px-5 py-16 md:px-8 md:py-24 ${pillarVariant === 6 ? "max-w-6xl" : "max-w-4xl"}`}>
          <h2 className="ds-reveal font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
            Why BeePaws
          </h2>
          <p className="ds-reveal mt-3 max-w-xl text-brown">
            Plain-spoken about what our tools do, and what they do not.
          </p>
          {/* Layout variant switch (spec §5). Option 3 = shipped default
              (horizontal manifesto bands). Option 5 = experimental, via ?variant=5.
              Copy + icons identical across variants; only the arrangement differs. */}
          {pillarVariant === 5 ? (
            /* Option 5 — four EQUAL cards around a restrained connective hub;
               asymmetric on desktop (columns step in opposite directions), clean
               single-column stack on mobile. The center is a quiet compositional
               anchor, never a featured 5th element. */
            <div className="relative mt-14">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block"
              >
                <Image
                  src="/logo.png"
                  alt=""
                  width={1233}
                  height={1613}
                  className="h-auto w-44 select-none drop-shadow-[0_12px_28px_rgba(74,46,22,0.20)]"
                />
              </div>

              <div className="ds-stagger relative z-10 grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-x-48 md:gap-y-8">
                {PILLARS.map((p, i) => (
                  <article
                    key={p.title}
                    className={`rounded-2xl border border-line bg-paper p-7 shadow-[0_10px_30px_-18px_rgba(74,46,22,0.35)] transition-[box-shadow,border-color] duration-200 hover:border-clay/40 hover:shadow-[0_18px_44px_-20px_rgba(74,46,22,0.45)] md:p-8 ${
                      i % 2 === 0 ? "md:-translate-y-8" : "md:translate-y-8"
                    }`}
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-honey-tint text-clay">
                      <p.icon size={26} strokeWidth={1.9} />
                    </span>
                    <h3 className="mt-5 font-display text-xl font-semibold text-cocoa md:text-2xl">{p.title}</h3>
                    <p className="mt-2 leading-relaxed text-brown">{p.body}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : pillarVariant === 6 ? (
            /* Option 6 — Shrine-inspired (benefits-flank-a-photo pattern from
               the shrine-pro demo): two pillars each side of a CENTRAL WARM
               SCENE. The Shrine original works because its center is an
               emotional photograph — so the center here is an ILLUSTRATIVE
               image slot (AI ok, quality-inspected; never evidentiary), NOT
               the logo (Option 5's mistake). Pillars stay de-carded, same
               grammar as §3's principles. Mobile: heading → image → pillars
               stacked (DOM order: image first).

               Layout: ONE 2×3 grid — scene spans both rows in the center
               column, pillars sit in the four corner cells, so both sides
               share row heights and stay symmetric regardless of copy length
               (independent flex columns drifted; user screenshot). Center
               column gets the LARGEST share so the scene dominates.
               items-start: row-mates align at their TOPS — center-alignment
               staggers the titles when copy lengths differ. */
            <div className="ds-reveal mt-12 grid items-start gap-x-8 gap-y-10 md:grid-cols-[4fr_5fr_4fr] md:grid-rows-2 lg:gap-x-12">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-honey-tint md:col-start-2 md:row-start-1 md:row-span-2 md:aspect-[3/4]">
                {/* TODO: warm at-home moment (owner + pet, hands-on care).
                    Illustrative slot — AI ok later, never stock fur. */}
                <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Warm scene (illustrative)</span>
              </div>
              {PILLARS.map((p, i) => (
                <article
                  key={p.title}
                  className={
                    [
                      "md:col-start-1 md:row-start-1",
                      "md:col-start-1 md:row-start-2",
                      "md:col-start-3 md:row-start-1",
                      "md:col-start-3 md:row-start-2",
                    ][i]
                  }
                >
                  <p.icon size={26} strokeWidth={1.75} className="text-clay" />
                  <h3 className="mt-3 font-display text-xl font-semibold text-cocoa">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-brown">{p.body}</p>
                </article>
              ))}
            </div>
          ) : (
            /* Option 3 — shipped default: equal-weight horizontal manifesto bands. */
            <div className="ds-stagger mt-10 divide-y divide-line border-y border-line">
              {PILLARS.map((p) => (
                <article key={p.title} className="flex items-start gap-5 py-7 md:gap-8 md:py-9">
                  <p.icon size={32} strokeWidth={1.75} className="mt-1 shrink-0 text-clay" />
                  <div>
                    <h3 className="font-display text-xl font-semibold text-cocoa md:text-2xl">{p.title}</h3>
                    <p className="mt-2 max-w-2xl leading-relaxed text-brown">{p.body}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───── Section 6 · Real proof - testimonials (consolidated spec §6) ───────
          Path B (testimonial-led): photo is the hero of each card, THREE large cards
          in a row, breed-matched attribution. Photos MUST be real customer-and-pet
          shots with permission - NEVER stock. Quotes are brand-experience draft.
          Path A (guarantee-forward + founder note) is a later funnel A/B - see the
          founder-note placeholder before Promise. */}
      <section className="bg-honey-tint">
        <div className="ds-reveal mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
            Real pets. Real moms. Real photos.
          </h2>
          <div className="ds-stagger mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {[
              { quote: "I never thought I'd be the kind of person who does this at home. Turns out I am, and I like it.", breed: "Goldendoodle mom" },
              { quote: "I read every label before it goes near my pet. This is the first one I didn't put back.", breed: "Senior terrier mom" },
              { quote: "No vet-office stress, no wrestling. We just do it on the couch now.", breed: "Cat mom" },
            ].map((t, i) => (
              <figure key={i} className="ds-lift overflow-hidden rounded-2xl border border-line bg-card">
                {/* Photo is the hero element. TODO: real customer-and-pet photo
                    (owner's hand/arm in frame), permission given. No stock, ever. */}
                <div className="relative flex aspect-[4/3] items-center justify-center bg-honey-tint">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Customer + pet photo</span>
                </div>
                <div className="p-6 md:p-8">
                  <blockquote className="text-lg leading-relaxed text-cocoa">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-5 text-sm">
                    {/* TODO: real first name + breed (breed-matched proof converts hardest) */}
                    <span className="font-bold text-cocoa">Name</span>
                    <span className="text-brown"> · {t.breed}</span>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
          <p className="mt-6 text-xs text-brown/60">
            Placeholder proof. Replace with three real customer-and-pet photos (permission given) and verified, brand-experience testimonials before launch. Never stock.
          </p>
        </div>
      </section>

      {/* ───── Section 7 · Founder note - DEFERRED (Path A only, consolidated spec §7)
          Not built: Path B (chosen for launch) has no founder note, and Path A needs
          a REAL founder photo + statement (never AI). When testing Path A, add here a
          bg-cream band: real founder photo + name + 2-3 honest sentences on why
          BeePaws exists and starts small. */}

      {/* ───── Section 8 · The promise - guarantee band ────────────────────────
          Blueprint §6. Risk reversal as a brand commitment. Bark closing band,
          matching the product page's final-CTA tone (gold seal on a paper island).
          The honest hedge - what we will NOT do - is the conversion. DRAFT copy. */}
      {/* Inset top vignette: the light→dark drop read as a flat pasted slab
          (crisp edge alone was "still a bit weird"); a soft ink edge at the
          band's top makes the drop feel like depth instead of a color swap.
          Strengthened from 28/44/0.45 — that version was imperceptible on the
          dark ground (user couldn't spot it). */}
      <section className="bg-bark shadow-[inset_0_36px_56px_-28px_rgba(0,0,0,0.55)]">
        <div className="ds-reveal mx-auto max-w-4xl px-5 py-16 text-center md:px-6 md:py-20">
          <h2 className="font-display text-3xl font-semibold leading-tight text-white md:text-[34px]">
            Try it for 30 days. If it is not for your pet, send it back.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/80 md:text-base">
            A full refund, no restocking fee, no hassle. We would rather you keep what works than keep what does not.
          </p>
          <Link
            href="/collections/all"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-base font-bold text-cocoa shadow-sm transition-colors hover:bg-gold-deep hover:text-white active:scale-[0.97] md:text-lg"
          >
            Start now
          </Link>
          {/* Guarantee card - two NEAR-EQUAL halves (spec §8): the guarantee and
              "what we won't do" carry the same weight, since the "we won't invent a
              review" line is the Amazon-comparison inoculation and is strategically
              central. Paper island, gold seal (matches the product page tone). */}
          <div className="mx-auto mt-10 grid gap-7 rounded-2xl border-2 border-gold bg-paper p-7 text-left shadow-[0_14px_40px_-16px_rgba(0,0,0,0.4)] md:grid-cols-2 md:gap-0 md:p-0">
            {/* Half 1 - the guarantee. Stacks centered under ~640px: the 96px
                seal + text side-by-side left ~150px of copy width on a phone. */}
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left md:p-9">
              <div
                className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full text-cocoa shadow-[0_8px_24px_-8px_rgba(74,46,22,0.45)]"
                style={{ background: "radial-gradient(circle at 38% 32%, #E7A92F, #C8901C)" }}
              >
                <span className="font-display text-[30px] font-bold leading-none">30</span>
                <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.08em]">Day Promise</span>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold leading-tight text-cocoa">Money-back guarantee</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-brown">
                  Send it back within 30 days for a full refund. No restocking fee, no hassle.
                </p>
              </div>
            </div>
            {/* Half 2 - what we won't do (co-equal; the inoculation line) */}
            <div className="border-t border-line pt-7 md:border-l md:border-t-0 md:p-9 md:pt-9">
              <h3 className="font-display text-xl font-semibold leading-tight text-cocoa">What we won&rsquo;t do</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-brown">
                We won&rsquo;t claim to replace your vet, hide an ingredient, or invent a review. The honest version is the only version we sell.
              </p>
            </div>
          </div>
          {/* cream/70 (not the old #A8A48F) — that hex sat at ~3.9:1 on bark,
              under the 4.5:1 AA floor for text this small. */}
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.08em] text-cream/70">
            Free shipping over $50 · 30-day refund · Real human support
          </p>
        </div>
      </section>

      {/* Inline newsletter section removed (consolidated spec): the passive footer
          subscribe stays; active capture is the scroll-triggered popup below. */}
    </div>
  );
}
