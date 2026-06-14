import React from 'react';
import Link from 'next/link';
import RevealObserver from '@/components/RevealObserver';
import NewsletterPopup from '@/components/NewsletterPopup';
import { ShoppingBag, ShieldCheck, Tag, HandHeart, PawPrint, CalendarCheck, Heart, Search, Shield } from 'lucide-react';

// ISR: revalidate via webhook → revalidateTag("products")
export const revalidate = 3600;

// ── Warm Honey + green (branch experiment/skill-design-taste) ──
// Reconciled palette (redesign-existing-projects pass): the page sits on the
// brand's Warm Honey base (cream bg, cocoa ink, gold/amber accent), so the
// cream header and (green) footer frame finally belongs. The experiment's
// forest green is KEPT as a deliberate, repeated SECONDARY: hero scrim,
// showcase block, bento + review accents, footer. That makes it a green twist
// ON the brand, not a cool palette fighting it. Per the skill's color rule:
// one warm neutral family + amber as the primary/CTA accent + green as a
// consistent structural color. Green was then dialed back to accents (hero
// scrim, review quote, footer, icons); the two largest blocks (showcase + the
// bento feature cell) became warm espresso and the newsletter a soft honey
// band, not bright orange. Display headings use the brand serif (font-display /
// Fraunces) site-wide to match the PDP; the hero keeps its composition, only
// the headline typeface changes.
const ds: React.CSSProperties = {
  // @ts-expect-error CSS custom properties
  '--ds-bg': '#FBF3E1',       // brand cream - Warm Honey base
  '--ds-surface': '#FDF8EC',  // brand paper - cards
  '--ds-green': '#1F3D2B',    // forest - secondary accent (kept)
  '--ds-green-deep': '#15241A',
  '--ds-ink': '#4A2E16',      // brand cocoa - headings + body
  '--ds-muted': '#6E5D44',    // warm taupe - secondary text
  '--ds-amber': '#E0892F',    // primary accent / CTAs (kept - hero)
  '--ds-amber-deep': '#C2731E',
  '--ds-line': '#E8DCC0',     // warm sand line
  '--ds-espresso': '#3A2616', // warm-dark feature blocks (showcase, bento cell)
  '--ds-honey': '#E9CC8E',    // soft honey band (newsletter) - not bright orange
};

// Grooming category goes live ~2 weeks after dental (blueprint "launch context").
// Flip to true when grooming SKUs are published. Until then the grooming slot is
// hidden entirely - never shown as "coming soon" (blueprint hard rule).
const SHOW_GROOMING = false;

export default function Home() {
  return (
    <div
      style={ds}
      className="flex w-full flex-col bg-[var(--ds-bg)] text-[var(--ds-ink)] [font-family:var(--font-body)]"
    >
      {/* Scroll-reveal driver + no-JS fallback so content is never hidden */}
      <RevealObserver />
      {/* Scroll-triggered newsletter popup (replaces the inline newsletter section) */}
      <NewsletterPopup />
      <noscript
        dangerouslySetInnerHTML={{
          __html: '<style>.ds-reveal,.ds-stagger>*{opacity:1!important;transform:none!important}</style>',
        }}
      />

      {/* ───── Section 2 · Hero - light two-column lifestyle (consolidated spec §2)
          Brand-level, no product. Real Warm Honey tokens (off the old --ds-* vars).
          Left: eyebrow / headline / honest-hedge subhead / CTA pair / trust strip.
          Right: a real lifestyle SCENE (pet in lap, warm light, no product) - a
          labeled placeholder until the shoot/AI lands. Entrance motion kept. */}
      <section className="bg-paper">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-14 md:px-8 md:py-24">
          <div className="ds-hero-stagger">
            <span className="inline-flex items-center rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-clay">
              At-home pet wellness · no hype
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-cocoa sm:text-5xl lg:text-6xl">
              Keep your pet healthy,<br />on your own terms.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-brown">
              Honest tools for the care you would rather do at home. We don&rsquo;t claim to replace your vet — just to keep you out of the chair for the easy stuff.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/collections/all"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-clay px-9 text-base font-bold text-white shadow-sm transition-colors duration-200 hover:bg-cocoa active:scale-[0.97]"
              >
                <ShoppingBag size={20} strokeWidth={2} /> {SHOW_GROOMING ? "Shop the range" : "Shop dental"}
              </Link>
              <Link
                href="#why"
                className="inline-flex h-14 items-center justify-center rounded-full border-2 border-cocoa px-9 text-base font-bold text-cocoa transition-colors duration-200 hover:bg-cocoa hover:text-white active:scale-[0.97]"
              >
                Why BeePaws
              </Link>
            </div>
            {/* Trust strip - real, verifiable facts only (spec §8: confirm these +
                optionally add "Made in [country]" once verified). */}
            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-brown">
              {["Xylitol-free", "30-day guarantee", "Free shipping over $50"].map((fact, i) => (
                <span key={fact} className="flex items-center gap-x-3">
                  {i > 0 && <span aria-hidden className="text-line">·</span>}
                  {fact}
                </span>
              ))}
            </div>
          </div>
          {/* Right: lifestyle scene. Illustrative (AI ok later); NO product, NO stock
              fur close-up. TODO: real warm at-home scene (pet in lap, hands visible). */}
          <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[2rem] bg-honey-tint md:min-h-[460px]">
            <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Lifestyle scene</span>
          </div>
        </div>
      </section>

      {/* ───── Section 3 · Why at-home care works (consolidated spec §3) ──────────
          LEADS the page: converts the "is at-home care even legit?" skeptic before
          the product. 2-zone: warm outcome image (illustrative) + 2x2 grid of four
          category-agnostic wellness principles. Persuasion copy (DRAFT, voice pass). */}
      <section className="bg-honey-tint">
        <div className="ds-reveal mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[45fr_55fr] md:gap-14 md:px-8 md:py-24">
          {/* Left: warm outcome image (illustrative; AI ok later; no attribution) */}
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[2rem] bg-cream md:min-h-[440px]">
            <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Warm outcome scene</span>
          </div>
          {/* Right: the argument (must convert the skeptic, not just list nice ideas) */}
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
              Why at-home care works
            </h2>
            <p className="mt-3 max-w-xl text-brown">
              The vet is for the big stuff. Most of what keeps a pet healthy is small, regular, and yours to do.
            </p>
            <div className="ds-stagger mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {[
                { icon: CalendarCheck, title: "Consistency beats intensity", body: "A little, often, beats a big production once in a while. The routines that work are the ones small enough to actually keep." },
                { icon: Heart, title: "Calm matters", body: "A calm pet lets you do more, and a calm routine is one you will not quit. Stress is what makes people give up halfway." },
                { icon: Search, title: "You catch things early", body: "Handle your pet regularly and you notice the sore gum, the lump, the limp while it is still small and cheap to fix." },
                { icon: Shield, title: "Prevention over treatment", body: "The kindest, cheapest fix is the one that stops a problem before it ever becomes a vet visit." },
              ].map((p) => (
                <article key={p.title} className="rounded-2xl bg-card p-6">
                  <p.icon size={26} strokeWidth={1.75} className="text-clay" />
                  <h3 className="mt-3 font-display text-lg font-semibold text-cocoa">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-brown">{p.body}</p>
                </article>
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
            <article className="ds-lift grid overflow-hidden rounded-3xl border border-line bg-card shadow-[var(--elev-shadow-card)] md:grid-cols-5">
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
              <article className="ds-lift overflow-hidden rounded-3xl border border-line bg-card shadow-[var(--elev-shadow-card)]">
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
              <article className="ds-lift overflow-hidden rounded-3xl border border-line bg-card shadow-[var(--elev-shadow-card)]">
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
        <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-24">
          <h2 className="ds-reveal font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
            Why BeePaws
          </h2>
          <p className="ds-reveal mt-3 max-w-xl text-brown">
            Plain-spoken about what our tools do, and what they do not.
          </p>
          <div className="ds-stagger mt-10 divide-y divide-line border-y border-line">
            {[
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
            ].map((p) => (
              <article key={p.title} className="flex items-start gap-5 py-7 md:gap-8 md:py-9">
                <p.icon size={32} strokeWidth={1.75} className="mt-1 shrink-0 text-clay" />
                <div>
                  <h3 className="font-display text-xl font-semibold text-cocoa md:text-2xl">{p.title}</h3>
                  <p className="mt-2 max-w-2xl leading-relaxed text-brown">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
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
              <figure key={i} className="ds-lift overflow-hidden rounded-3xl border border-line bg-card">
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
      <section className="bg-bark">
        <div className="ds-reveal mx-auto max-w-4xl px-5 py-16 text-center md:px-6 md:py-20">
          <h2 className="font-display text-3xl font-semibold leading-tight text-white md:text-[34px]">
            Try it for 30 days. If it is not for your pet, send it back.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#CFCBBA] md:text-base">
            A full refund, no restocking fee, no hassle. We would rather you keep what works than keep what does not.
          </p>
          <Link
            href="/collections/all"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-base font-bold text-cocoa shadow-sm transition-colors hover:bg-gold-deep hover:text-white active:scale-[0.97] md:text-lg"
          >
            {SHOW_GROOMING ? "Shop the range" : "Shop dental"}
          </Link>
          {/* Guarantee card - two NEAR-EQUAL halves (spec §8): the guarantee and
              "what we won't do" carry the same weight, since the "we won't invent a
              review" line is the Amazon-comparison inoculation and is strategically
              central. Paper island, gold seal (matches the product page tone). */}
          <div className="mx-auto mt-10 grid gap-7 rounded-2xl border-2 border-gold bg-paper p-7 text-left shadow-[0_14px_40px_-16px_rgba(0,0,0,0.4)] md:grid-cols-2 md:gap-0 md:p-0">
            {/* Half 1 - the guarantee */}
            <div className="flex items-center gap-5 md:p-9">
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
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.08em] text-[#A8A48F]">
            Free shipping over $50 · 30-day refund · Real human support
          </p>
        </div>
      </section>

      {/* Inline newsletter section removed (consolidated spec): the passive footer
          subscribe stays; active capture is the scroll-triggered popup below. */}
    </div>
  );
}
