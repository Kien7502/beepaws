import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import { Sparkles, ShoppingBag, Shield, Truck, RefreshCcw, Star, ArrowRight, Scissors, Heart, Zap } from 'lucide-react';

import { getProducts } from '@/lib/shopify/queries';

// ISR: revalidate via webhook → revalidateTag("products")
export const revalidate = 3600;

export default async function Home() {
  const products = await getProducts();
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="flex flex-col w-full pb-20">

      {/* ───── Hero ───── */}
      <section className="relative w-full min-h-[min(92vh,900px)] overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-slate-950 z-0">
          <Image
            src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=2000&auto=format&fit=crop"
            alt="Happy pets"
            fill
            className="object-cover opacity-45 mix-blend-overlay"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 hero-texture z-[1]" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/70 to-[#1a3d14]/60 z-[2]" />
        </div>

        {/* Decorative floating paw prints */}
        <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden" aria-hidden>
          <span className="absolute left-[8%] top-[20%] text-5xl opacity-10 rotate-[-15deg]">🐾</span>
          <span className="absolute right-[12%] top-[15%] text-6xl opacity-8 rotate-[20deg]">🐾</span>
          <span className="absolute left-[5%] bottom-[25%] text-4xl opacity-10 rotate-[10deg]">🐾</span>
          <span className="absolute right-[8%] bottom-[30%] text-5xl opacity-8 rotate-[-10deg]">🐾</span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 flex flex-1 min-h-0 items-center justify-center text-center py-20 md:py-28">
          <div className="max-w-3xl w-full flex flex-col items-center">
            <div className="inline-flex items-center space-x-2 bg-[var(--color-primary)]/25 backdrop-blur-md px-5 py-2 rounded-full text-[var(--color-primary)] font-bold text-sm mb-6 sm:mb-8 border border-[var(--color-primary)]/40 shadow-sm">
              <Sparkles size={15} />
              <span>Premium Pet Grooming & Care</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.08] mb-6 max-w-4xl mx-auto px-1 sm:px-0">
              <span className="block">Your pet deserves</span>
              <span className="hero-gradient-heading mt-1 block pb-2">the absolute best.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-medium mb-10 max-w-2xl leading-relaxed">
              Professional-grade grooming tools and pet care essentials — crafted for the comfort and happiness of your furry family.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm sm:max-w-none">
              <Link href="/collections/all">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-bold" leftIcon={<ShoppingBag size={20} />}>
                  Shop Now
                </Button>
              </Link>
              <Link href="/collections/all">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-bold bg-white/10 text-white border-2 border-white/50 hover:bg-white/20 transition-all backdrop-blur-md">
                  View Best Sellers
                </Button>
              </Link>
            </div>

            {/* Quick trust strip */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/60 text-xs font-medium">
              <span className="flex items-center gap-1.5"><Truck size={14} /> Free shipping over $50</span>
              <span className="flex items-center gap-1.5"><Shield size={14} /> Safe &amp; vet-approved</span>
              <span className="flex items-center gap-1.5"><RefreshCcw size={14} /> 30-day returns</span>
            </div>
          </div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0 z-[4]">
          <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none" style={{height: '48px'}}>
            <path d="M0 64L1440 64L1440 32C1200 64 960 0 720 0C480 0 240 64 0 32L0 64Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* ───── Category Pills ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl pt-12 pb-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { label: "Nail Care", icon: "✂️", href: "/collections/all" },
            { label: "Hair Trimming", icon: "🪮", href: "/collections/all" },
            { label: "Grooming Kits", icon: "🧴", href: "/collections/all" },
            { label: "Dog Supplies", icon: "🐶", href: "/collections/all" },
            { label: "Cat Supplies", icon: "🐱", href: "/collections/all" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-foreground)] shadow-sm transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 hover:text-[var(--color-primary)]"
            >
              <span>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ───── Featured Products ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl pt-16 md:pt-20 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
              Best Sellers
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[var(--color-foreground)] mb-3 leading-tight">
              Pawsitively Perfect Picks
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">
              Hand-selected grooming favorites trusted by pet parents everywhere.
            </p>
          </div>
          <Link href="/collections/all" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] hover:underline">
            View All Products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 px-4 bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] rounded-3xl text-center max-w-md mx-auto">
              <p className="text-[var(--color-foreground)] font-black text-xl mb-2">No products yet</p>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                Add Admin API credentials in .env.local to show products here.
              </p>
              <Link href="/collections/all">
                <Button variant="outline">Browse catalog</Button>
              </Link>
            </div>
          ) : (
            featuredProducts.map((product) => {
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
                />
              );
            })
          )}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/collections/all">
            <Button variant="outline" fullWidth>View All Products</Button>
          </Link>
        </div>
      </section>

      {/* ───── Why Beepaws ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl py-16 md:py-20">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
            Why Beepaws
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-[var(--color-foreground)] leading-tight">
            Grooming made easy, at home
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {[
            {
              icon: <Scissors className="h-7 w-7" />,
              title: "Pro-Grade Tools",
              desc: "Stainless steel blades and precision-engineered clippers trusted by groomers.",
            },
            {
              icon: <Heart className="h-7 w-7" />,
              title: "Pet-Safe Design",
              desc: "Rounded safety tips and low-vibration motors so even anxious pets stay calm.",
            },
            {
              icon: <Zap className="h-7 w-7" />,
              title: "USB Rechargeable",
              desc: "No batteries needed — long-lasting charge for full grooming sessions.",
            },
            {
              icon: <Star className="h-7 w-7" />,
              title: "Loved by Thousands",
              desc: "5-star reviewed products that pet parents come back to again and again.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-start gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--elev-shadow-card)] transition-all hover:shadow-[var(--elev-shadow-card-hover)] hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                {item.icon}
              </div>
              <div>
                <p className="text-base font-extrabold text-[var(--color-foreground)] mb-1">{item.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Showcase Banner ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl py-4 md:py-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[var(--color-accent)] shadow-2xl">
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1600&auto=format&fit=crop"
              alt="Dog grooming"
              fill
              className="object-cover opacity-20"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-14 items-center">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-4 px-3 py-1 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30">
                New Arrivals
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight">
                Complete grooming, <br className="hidden md:block" />right at home.
              </h2>
              <p className="text-white/80 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                From nail clippers to full-body trimmers — everything your pet needs for a spa-day experience without leaving home.
              </p>
              <Link href="/collections/all">
                <Button size="lg" className="h-13 px-8 font-bold bg-white text-[var(--color-accent)] hover:bg-slate-100 border-none shadow-xl">
                  Explore All Products <ArrowRight size={18} className="ml-1" />
                </Button>
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop"
                  alt="Two dogs playing"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 16rem, 20rem"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Social Proof / Reviews Strip ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-5xl py-16 md:py-20">
        <div className="text-center mb-10">
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({length: 5}).map((_, i) => (
              <Star key={i} size={20} className="fill-[var(--color-primary)] text-[var(--color-primary)]" />
            ))}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loved by pet parents worldwide</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Sarah M.",
              pet: "Labrador owner",
              text: "The LED nail clipper is a game-changer! I used to be so scared of clipping too short — now I can see exactly where to cut. My dog is so much calmer too.",
              avatar: "S",
            },
            {
              name: "James T.",
              pet: "Persian cat owner",
              text: "Bought the electric trimmer for my fluffy Persian. It's whisper-quiet and she barely notices it. Way better than fighting her at the grooming salon.",
              avatar: "J",
            },
            {
              name: "Linh N.",
              pet: "Poodle owner",
              text: "The 3-in-1 grooming kit is incredible value. Clips, trims nails, and cleans paws all in one device. My poodle's weekly groom takes 20 minutes now!",
              avatar: "L",
            },
          ].map((review) => (
            <div
              key={review.name}
              className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--elev-shadow-card)]"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({length: 5}).map((_, i) => (
                  <Star key={i} size={14} className="fill-[var(--color-primary)] text-[var(--color-primary)]" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-sm font-extrabold text-[var(--color-primary)]">
                  {review.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">{review.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{review.pet}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Newsletter ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl pb-4">
        <div className="bg-gradient-to-br from-[var(--color-primary)] to-amber-500 rounded-[2.5rem] p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

          <div className="md:w-1/2 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-white/90 text-xs font-bold mb-4 border border-white/30">
              <Sparkles size={12} /> Beepaws Newsletter
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Join the <br className="hidden md:block" />Beepaws Family
            </h2>
            <p className="text-white/85 text-base md:text-lg font-medium max-w-md">
              Sign up today and get <span className="font-extrabold text-white">15% off</span> your first order, plus expert pet care tips delivered weekly.
            </p>
          </div>

          <div className="md:w-1/2 relative z-10 w-full max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 bg-white/15 p-2 rounded-2xl sm:rounded-full border border-white/25 backdrop-blur-md">
              <input
                type="email"
                placeholder="Your email address"
                className="bg-transparent text-white placeholder-white/60 px-5 py-3 flex-grow outline-none font-medium rounded-xl sm:rounded-full min-h-[48px] border border-transparent"
              />
              <button
                type="button"
                className="bg-white text-amber-600 font-extrabold hover:bg-amber-50 transition-colors rounded-xl sm:rounded-full px-7 py-3 shrink-0 min-h-[48px] shadow-md"
              >
                Join now
              </button>
            </div>
            <p className="text-center text-white/60 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
