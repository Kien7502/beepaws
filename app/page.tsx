import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { ShoppingBag, Shield, Truck, RefreshCcw, ArrowRight, Scissors, Bath, Dog, Cat, Bone, Wind, Star } from 'lucide-react';

import { getProducts } from '@/lib/shopify/queries';

// ISR: revalidate via webhook → revalidateTag("products")
export const revalidate = 3600;

// ── design-taste-frontend experiment (branch experiment/skill-design-taste) ──
// Redesign-OVERHAUL of the homepage to contrast with the identity-preserving
// redesign-existing-projects pass. Palette is page-scoped (CSS vars on the
// wrapper) so the rest of the site stays Warm Honey. "Forest" palette: deep
// green + cool off-white + a single amber accent (rotated off the banned
// premium-consumer cream+brass default). Sans display (no Fraunces). Dials:
// VARIANCE 8 / MOTION 3 (CSS only) / DENSITY 3.
const ds: React.CSSProperties = {
  // @ts-expect-error CSS custom properties
  '--ds-bg': '#F3F5F1',       // cool off-white (not warm cream)
  '--ds-surface': '#FFFFFF',
  '--ds-green': '#1F3D2B',    // deep forest - dark sections
  '--ds-green-deep': '#15241A',
  '--ds-ink': '#1A1F18',      // near-black, faint green
  '--ds-muted': '#56604F',    // muted body
  '--ds-amber': '#E0892F',    // single accent
  '--ds-amber-deep': '#C2731E',
  '--ds-line': '#DDE0D7',
};

export default async function Home() {
  const products = await getProducts();
  const featuredProducts = products.slice(0, 3);

  return (
    <div
      style={ds}
      className="flex w-full flex-col bg-[var(--ds-bg)] text-[var(--ds-ink)] [font-family:var(--font-body)]"
    >
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
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
              Premium pet grooming
            </span>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your pet deserves<br />the absolute best.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">
              Professional-grade grooming tools, built for the comfort and happiness of your furry family.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/collections/all"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--ds-amber)] px-9 text-base font-bold text-[var(--ds-green-deep)] shadow-lg transition-all duration-200 hover:bg-[var(--ds-amber-deep)] hover:text-white active:scale-[0.98]"
              >
                <ShoppingBag size={20} strokeWidth={2} /> Shop now
              </Link>
              <Link
                href="/collections/all"
                className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/40 px-9 text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
              >
                View best sellers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Trust band (moved out of the hero per skill) ───── */}
      <section className="border-b border-[var(--ds-line)] bg-[var(--ds-surface)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-5 text-sm font-semibold text-[var(--ds-muted)] md:px-8">
          <span className="flex items-center gap-2"><Truck size={17} strokeWidth={2} className="text-[var(--ds-amber-deep)]" /> Free shipping over $50</span>
          <span className="flex items-center gap-2"><Shield size={17} strokeWidth={2} className="text-[var(--ds-amber-deep)]" /> Safe &amp; vet-approved</span>
          <span className="flex items-center gap-2"><RefreshCcw size={17} strokeWidth={2} className="text-[var(--ds-amber-deep)]" /> 30-day returns</span>
        </div>
      </section>

      {/* ───── Category row (icons, not emoji) ───── */}
      <section className="mx-auto w-full max-w-7xl px-5 pt-14 md:px-8">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "Nail care", icon: Scissors, href: "/collections/all" },
            { label: "Hair trimming", icon: Wind, href: "/collections/all" },
            { label: "Grooming kits", icon: Bath, href: "/collections/all" },
            { label: "Dog supplies", icon: Dog, href: "/collections/all" },
            { label: "Cat supplies", icon: Cat, href: "/collections/all" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--ds-line)] bg-[var(--ds-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ds-ink)] transition-all duration-200 hover:border-[var(--ds-green)] hover:-translate-y-0.5"
            >
              <cat.icon size={16} strokeWidth={2} className="text-[var(--ds-green)]" />
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ───── Featured products (real product grid) ───── */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-16 pt-16 md:px-8 md:pt-20">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            {/* eyebrow #2 of 3 */}
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ds-amber-deep)]">Best sellers</span>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-[var(--ds-ink)] md:text-[2.6rem]">
              Hand-picked favorites
            </h2>
            <p className="mt-3 text-lg text-[var(--ds-muted)]">
              Favorites your pets keep coming back to.
            </p>
          </div>
          <Link href="/collections/all" className="hidden items-center gap-2 text-sm font-bold text-[var(--ds-green)] hover:gap-3 md:inline-flex transition-all">
            View all products <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {featuredProducts.length === 0 ? (
            <div className="col-span-full mx-auto flex max-w-xl flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--ds-line)] bg-[var(--ds-surface)] px-4 py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ds-green)]/10 text-[var(--ds-green)]" aria-hidden>
                <Bone size={30} strokeWidth={1.75} />
              </div>
              <p className="text-xl font-bold text-[var(--ds-ink)]">No featured products yet</p>
              <p className="mt-2 font-medium text-[var(--ds-muted)]">
                Activate products and publish them to the Online Store sales channel to show them here.
              </p>
              <Link href="/collections/all" className="mt-6 inline-flex h-12 items-center rounded-full border-2 border-[var(--ds-green)] px-6 font-bold text-[var(--ds-green)] transition-all hover:bg-[var(--ds-green)] hover:text-white">
                Browse catalog
              </Link>
            </div>
          ) : (
            featuredProducts.map((product, index) => {
              const price = parseFloat(product.priceRange.minVariantPrice.amount);
              const formattedPrice = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: product.priceRange.minVariantPrice.currencyCode,
              }).format(price);
              return (
                <ProductCard
                  key={product.handle}
                  handle={product.handle}
                  title={product.title}
                  price={formattedPrice}
                  imageUrl={product.images?.edges[0]?.node?.url || "/product-placeholder.svg"}
                  product={product}
                  priority={index === 0}
                />
              );
            })
          )}
        </div>
      </section>

      {/* ───── Why Beepaws - asymmetric bento (breaks the 4-equal-card row) ───── */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <h2 className="mb-10 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[var(--ds-ink)] md:text-[2.6rem]">
          Grooming made easy, at home
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-5">
          {/* Large feature cell - deep green, spans 2 rows */}
          <article className="flex flex-col justify-between rounded-3xl bg-[var(--ds-green)] p-7 text-white md:row-span-2">
            <Scissors size={30} strokeWidth={1.75} className="text-[var(--ds-amber)]" />
            <div className="mt-10">
              <h3 className="text-2xl font-bold">Pro-grade tools</h3>
              <p className="mt-2 text-base leading-relaxed text-white/75">
                Stainless steel blades and precision-engineered clippers trusted by working groomers, now sized for your living room.
              </p>
            </div>
          </article>
          {/* Wide cell - amber tint */}
          <article className="flex items-start gap-4 rounded-3xl bg-[var(--ds-amber)]/12 p-7 md:col-span-2">
            <Shield size={26} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[var(--ds-amber-deep)]" />
            <div>
              <h3 className="text-xl font-bold text-[var(--ds-ink)]">Pet-safe by design</h3>
              <p className="mt-1.5 text-[var(--ds-muted)] leading-relaxed">
                Rounded safety tips and low-vibration motors keep even anxious pets calm through the whole session.
              </p>
            </div>
          </article>
          {/* Two small cells */}
          <article className="rounded-3xl border border-[var(--ds-line)] bg-[var(--ds-surface)] p-7">
            <Bath size={24} strokeWidth={1.75} className="text-[var(--ds-green)]" />
            <h3 className="mt-4 text-lg font-bold text-[var(--ds-ink)]">USB rechargeable</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--ds-muted)]">
              No batteries. A long charge lasts through full grooming sessions.
            </p>
          </article>
          <article className="rounded-3xl border border-[var(--ds-line)] bg-[var(--ds-surface)] p-7">
            <Star size={24} strokeWidth={1.75} className="text-[var(--ds-green)]" />
            <h3 className="mt-4 text-lg font-bold text-[var(--ds-ink)]">Loved by thousands</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--ds-muted)]">
              5-star reviewed products pet parents come back to again and again.
            </p>
          </article>
        </div>
      </section>

      {/* ───── Showcase - split image / text ───── */}
      <section className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-[2rem] bg-[var(--ds-green-deep)] md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-14">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
              Complete grooming, right at home.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">
              From nail clippers to full-body trimmers, everything your pet needs for a spa day without leaving the house.
            </p>
            <Link
              href="/collections/all"
              className="mt-8 inline-flex h-13 w-fit items-center gap-2 rounded-full bg-[var(--ds-amber)] px-7 py-3.5 font-bold text-[var(--ds-green-deep)] transition-all duration-200 hover:bg-white active:scale-[0.98]"
            >
              Explore all products <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
          <div className="relative min-h-[280px] md:min-h-[420px]">
            <Image
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1000&auto=format&fit=crop"
              alt="Two dogs playing together outdoors"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ───── Reviews - asymmetric: one lead quote + two stacked ───── */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="mb-10">
          {/* eyebrow #3 of 3 */}
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ds-amber-deep)]">From pet parents</span>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-[var(--ds-ink)] md:text-[2.6rem]">
            Worth the switch
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Lead quote */}
          <figure className="flex flex-col justify-between rounded-3xl bg-[var(--ds-green)] p-8 text-white md:p-10">
            <blockquote className="text-xl font-medium leading-relaxed md:text-2xl">
              &ldquo;The LED nail clipper changed how I groom at home. I can finally see exactly where to cut, so I never go too short, and my dog stays calm the whole time.&rdquo;
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ds-amber)] font-bold text-[var(--ds-green-deep)]">S</span>
              <span>
                <span className="block font-bold">Sarah M.</span>
                <span className="block text-sm text-white/60">Labrador owner</span>
              </span>
            </figcaption>
          </figure>
          {/* Two stacked */}
          <div className="grid grid-cols-1 gap-5">
            {[
              { name: "James T.", pet: "Persian cat owner", avatar: "J", text: "Whisper-quiet trimmer. My fluffy Persian barely notices it, which beats fighting her at the salon every month." },
              { name: "Linh N.", pet: "Poodle owner", avatar: "L", text: "The 3-in-1 kit clips, trims nails, and cleans paws in one device. My poodle's weekly groom now takes 20 minutes." },
            ].map((r) => (
              <figure key={r.name} className="flex flex-col justify-between rounded-3xl border border-[var(--ds-line)] bg-[var(--ds-surface)] p-7">
                <blockquote className="text-base leading-relaxed text-[var(--ds-ink)]">
                  &ldquo;{r.text}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ds-green)]/12 font-bold text-[var(--ds-green)]">{r.avatar}</span>
                  <span>
                    <span className="block text-sm font-bold text-[var(--ds-ink)]">{r.name}</span>
                    <span className="block text-xs text-[var(--ds-muted)]">{r.pet}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Newsletter - full-width amber band ───── */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8">
        <div className="rounded-[2rem] bg-[var(--ds-amber)] p-8 md:p-14">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[var(--ds-green-deep)] md:text-4xl lg:text-5xl">
                Join the Beepaws family
              </h2>
              <p className="mt-4 max-w-md text-lg font-medium text-[var(--ds-green-deep)]/80">
                Sign up and get <span className="font-extrabold">15% off</span> your first order, plus pet care tips every week.
              </p>
            </div>
            <form className="w-full max-w-md md:ml-auto">
              <label htmlFor="nl-email" className="mb-2 block text-sm font-semibold text-[var(--ds-green-deep)]">Email address</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="nl-email"
                  type="email"
                  placeholder="you@example.com"
                  className="min-h-[52px] flex-grow rounded-full border border-[var(--ds-green-deep)]/20 bg-[var(--ds-surface)] px-5 font-medium text-[var(--ds-ink)] outline-none placeholder:text-[var(--ds-muted)] focus:border-[var(--ds-green-deep)] focus:ring-2 focus:ring-[var(--ds-green-deep)]/20"
                />
                <button
                  type="submit"
                  className="min-h-[52px] shrink-0 rounded-full bg-[var(--ds-green-deep)] px-7 font-bold text-white transition-all duration-200 hover:bg-[var(--ds-green)] active:scale-[0.98]"
                >
                  Join now
                </button>
              </div>
              <p className="mt-3 text-xs text-[var(--ds-green-deep)]/70">No spam. Unsubscribe anytime.</p>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
