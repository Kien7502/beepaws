import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RevealObserver from '@/components/RevealObserver';
import { ShoppingBag, ShieldCheck, Tag, HandHeart, PawPrint } from 'lucide-react';

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
      <noscript
        dangerouslySetInnerHTML={{
          __html: '<style>.ds-reveal,.ds-stagger>*{opacity:1!important;transform:none!important}</style>',
        }}
      />

      {/* ───── Hero - full-bleed image, bottom-left anchored (asymmetric) ───── */}
      <section className="relative min-h-[min(94dvh,920px)] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=2000&auto=format&fit=crop"
          alt="A relaxed dog resting in soft daylight"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Green scrim, heavier bottom-left where the copy sits */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--ds-green-deep)] via-[var(--ds-green-deep)]/70 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[min(94dvh,920px)] max-w-7xl flex-col justify-end px-5 pb-20 pt-24 md:px-8 md:pb-28">
          <div className="ds-hero-stagger max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
              At-home pet wellness · no hype
            </span>
            <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Keep your pet healthy,<br />on your own terms.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">
              Honest tools for the care you would rather do at home. We don&rsquo;t claim to replace your vet — just to keep you out of the chair for the easy stuff.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/collections/all"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--ds-amber)] px-9 text-base font-bold text-[var(--ds-green-deep)] shadow-lg transition-all duration-200 hover:bg-[var(--ds-amber-deep)] hover:text-white active:scale-[0.97]"
              >
                <ShoppingBag size={20} strokeWidth={2} /> {SHOW_GROOMING ? "Shop the range" : "Shop dental"}
              </Link>
              <Link
                href="#why"
                className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/40 px-9 text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 active:scale-[0.97]"
              >
                Why BeePaws
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Section 3 · Category routing band - dental-first ─────────────────
          Blueprint §3. The page's primary routing job. Two-slot grid built from
          day one; the grooming slot is hidden (SHOW_GROOMING) until SKUs are
          live - never shown as "coming soon". Dental line uses the VOC glossary
          (fresh breath / pearly whites / pink gums). Real tokens (bg-cream band),
          ported motion (ds-reveal + ds-lift). DRAFT copy - needs the voice pass. */}
      <section className="bg-cream">
        <div className="ds-reveal mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
          {/* Heading reframes dental-only as a deliberate sequencing choice at
              launch; reverts to the multi-category promise when grooming is live. */}
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.4rem]">
            {SHOW_GROOMING ? "Shop by what your pet needs" : "Built first: dental"}
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
                {/* TODO: real product photo - the ultrasonic device in a calm domestic setting (no stock) */}
                <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Product photo</span>
              </div>
              <div className="flex flex-col justify-center p-8 md:col-span-2 md:p-10">
                <h3 className="font-display text-3xl font-semibold text-cocoa">Dental</h3>
                <p className="mt-3 leading-relaxed text-brown">
                  Pearly whites, pink gums, fresh breath — without the anesthesia.
                </p>
                <p className="mt-4 font-display text-lg font-semibold text-clay">
                  A $40 device, or a $1,400 vet bill.
                </p>
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

      {/* ───── Section 4 · Why BeePaws - brand pillars ─────────────────────────
          Blueprint §4. The homepage's real conversion work: four pillars drawn
          from the synthesis voice principles. Light tonal bento (no mid-page dark
          slab); pillar 3 (owner agency, the emotional anchor) is the feature cell.
          Real tokens (bg-card band), ported motion. DRAFT copy - voice pass needed. */}
      <section id="why" className="bg-card scroll-mt-24">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <h2 className="ds-reveal font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
            Why BeePaws
          </h2>
          <p className="ds-reveal mb-10 mt-3 max-w-xl text-brown">
            Plain-spoken about what our tools do, and what they do not.
          </p>
          <div className="ds-stagger grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-5">
            {/* Feature cell - Pillar 3: owner agency (emotional anchor), spans 2 rows */}
            <article className="ds-lift flex flex-col justify-between rounded-3xl bg-honey-tint p-7 md:row-span-2">
              <HandHeart size={30} strokeWidth={1.75} className="text-clay" />
              <div className="mt-10">
                <h3 className="font-display text-2xl font-semibold text-cocoa">She decides what touches her pet</h3>
                <p className="mt-2 leading-relaxed text-brown">
                  You read the label and keep your pet healthy on your own terms. We make tools for that, not shortcuts that ask you to hand your pet to a stranger.
                </p>
              </div>
            </article>
            {/* Wide cell - Pillar 1: honest about what it does */}
            <article className="ds-lift flex items-start gap-4 rounded-3xl bg-cream p-7 md:col-span-2">
              <ShieldCheck size={26} strokeWidth={1.75} className="mt-0.5 shrink-0 text-clay" />
              <div>
                <h3 className="font-display text-xl font-semibold text-cocoa">Honest about what it does</h3>
                <p className="mt-1.5 leading-relaxed text-brown">
                  Results in weeks, not overnight. Quiet, not silent. We tell you what this does — and what it doesn&rsquo;t.
                </p>
              </div>
            </article>
            {/* Pillar 2: read the label */}
            <article className="ds-lift rounded-3xl border border-line bg-card p-7">
              <Tag size={24} strokeWidth={1.75} className="text-clay" />
              <h3 className="mt-4 font-display text-lg font-semibold text-cocoa">Read-the-label transparency</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-brown">
                Every ingredient in plain English. Xylitol-free, and cat-safe wherever the label says so.
              </p>
            </article>
            {/* Pillar 4: made for the pet you have */}
            <article className="ds-lift rounded-3xl border border-line bg-card p-7">
              <PawPrint size={24} strokeWidth={1.75} className="text-clay" />
              <h3 className="mt-4 font-display text-lg font-semibold text-cocoa">Made for the pet you actually have</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-brown">
                {SHOW_GROOMING
                  ? "Small breeds. Senior pets. Anxious dogs. Long-haired cats with spicy opinions about brushes. Real names, real breeds, real photos — never stock fur."
                  : "Small breeds. Senior pets. Anxious dogs. Cats whose mouths have been quietly ignored. Real names, real breeds, real photos — never stock fur."}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ───── Section 5 · Real proof - testimonials (launch-bridge Rev 1) ───────
          Strengthened to carry the brand weight an origin section would: larger
          photo-led cards, more breathing room, breed-matched attribution, four
          testimonials. Photos MUST be real customer-and-pet shots with permission
          (owner content task) - NEVER stock. Quotes are brand-experience draft. */}
      <section className="bg-honey-tint">
        <div className="ds-reveal mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.6rem]">
            Real pets. Real moms. Real photos.
          </h2>
          <div className="ds-stagger mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
            {[
              { quote: "I never thought I'd be the kind of person who does this at home. Turns out I am, and I like it.", breed: "Goldendoodle mom" },
              { quote: "They told me it would take a few weeks, not a few days. It did. I trust a brand that levels with me.", breed: "Chihuahua mom" },
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
            Placeholder proof. Replace with four real customer-and-pet photos (permission given) and verified, brand-experience testimonials before launch. Never stock.
          </p>
        </div>
      </section>

      {/* ───── Section 5.5 · What we're building (launch-bridge Rev 2b) ──────────
          Honest-hedges at the brand level: names the dental-first state as a
          deliberate choice, not a constraint. No specific timelines (guardrail).
          Copy swaps on SHOW_GROOMING at grooming launch. DRAFT - voice pass. */}
      <section className="bg-cream">
        <div className="ds-reveal mx-auto max-w-2xl px-5 py-16 text-center md:px-8 md:py-20">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[2.4rem]">
            Where we&rsquo;re starting
          </h2>
          <p className="mt-4 leading-relaxed text-brown">
            {SHOW_GROOMING
              ? "BeePaws started with at-home dental. Grooming is now live, and supplements will come when we can do them honestly. We would rather ship a tight, honest range than promise a catalogue we can't fully stand behind."
              : "Right now BeePaws is one thing done well: at-home dental care. Grooming is next, and supplements only when we can do them honestly. We would rather ship a tight, honest range than promise a catalogue we can't fully stand behind."}
          </p>
        </div>
      </section>

      {/* ───── Section 6 · The promise - guarantee band ────────────────────────
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
          {/* Guarantee card - paper island, gold seal (matches the product page) */}
          <div className="mx-auto mt-9 grid items-center gap-7 rounded-2xl border-2 border-gold bg-paper p-7 text-left shadow-[0_14px_40px_-16px_rgba(0,0,0,0.4)] md:mt-10 md:grid-cols-[auto_1fr] md:gap-9 md:p-9">
            <div className="mx-auto md:mx-0">
              <div
                className="flex h-28 w-28 flex-col items-center justify-center rounded-full text-cocoa shadow-[0_8px_24px_-8px_rgba(74,46,22,0.45)]"
                style={{ background: "radial-gradient(circle at 38% 32%, #E7A92F, #C8901C)" }}
              >
                <span className="font-display text-[34px] font-bold leading-none">30</span>
                <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.08em]">Day Promise</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-display text-xl font-semibold leading-tight text-cocoa md:text-2xl">
                What we won&rsquo;t do
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-brown md:text-[15px]">
                We won&rsquo;t claim to replace your vet, hide an ingredient, or invent a review. The honest version is the only version we sell.
              </p>
            </div>
          </div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.08em] text-[#A8A48F]">
            Free shipping over $50 · 30-day refund · Real human support
          </p>
        </div>
      </section>

      {/* ───── Newsletter - soft honey band (not bright orange) ───── */}
      <section className="ds-reveal mx-auto w-full max-w-7xl px-5 pb-16 md:px-8">
        <div className="rounded-[2rem] bg-[var(--ds-honey)] p-8 md:p-14">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[var(--ds-ink)] md:text-4xl lg:text-5xl">
                Join the BeePaws family
              </h2>
              <p className="mt-4 max-w-md text-lg font-medium text-[var(--ds-ink)]/80">
                Get <span className="font-bold">15% off your first order</span>, then one email a month — no spam, no daily deals, just a note when there&rsquo;s something genuinely new worth telling you about.
              </p>
            </div>
            <form className="w-full max-w-md md:ml-auto">
              <label htmlFor="nl-email" className="mb-2 block text-sm font-semibold text-[var(--ds-ink)]">Email address</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="nl-email"
                  type="email"
                  placeholder="you@example.com"
                  className="min-h-[52px] flex-grow rounded-full border border-[var(--ds-ink)]/15 bg-[var(--ds-surface)] px-5 font-medium text-[var(--ds-ink)] outline-none placeholder:text-[var(--ds-muted)] focus:border-[var(--ds-amber-deep)] focus:ring-2 focus:ring-[var(--ds-amber-deep)]/25"
                />
                <button
                  type="submit"
                  className="min-h-[52px] shrink-0 rounded-full bg-[var(--ds-amber)] px-7 font-bold text-white transition-all duration-200 hover:bg-[var(--ds-amber-deep)] active:scale-[0.97]"
                >
                  Join now
                </button>
              </div>
              <p className="mt-3 text-xs text-[var(--ds-ink)]/70">No spam. Unsubscribe anytime.</p>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
