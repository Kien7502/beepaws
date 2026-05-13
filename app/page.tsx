import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import { Sparkles, ShoppingBag, Shield, Truck, RefreshCcw, Star, ArrowRight, Scissors, Heart, Zap, TrendingUp, BadgeCheck } from 'lucide-react';

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
            src="https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2000&auto=format&fit=crop"
            alt="Professional pet grooming"
            fill
            className="object-cover opacity-45 mix-blend-overlay"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 hero-texture z-[1]" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/70 to-[#1a3d14]/60 z-[2]" />
        </div>

        {/* Subtle SVG paw watermarks */}
        <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden" aria-hidden>
          <svg viewBox="0 0 120 120" className="absolute right-[6%] top-[12%] w-32 h-32 opacity-[0.06] rotate-[25deg]" fill="white" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="72" rx="28" ry="22" />
            <ellipse cx="36" cy="50" rx="11" ry="14" />
            <ellipse cx="84" cy="50" rx="11" ry="14" />
            <ellipse cx="48" cy="38" rx="9" ry="12" />
            <ellipse cx="72" cy="38" rx="9" ry="12" />
          </svg>
          <svg viewBox="0 0 120 120" className="absolute left-[4%] bottom-[20%] w-20 h-20 opacity-[0.05] rotate-[-12deg]" fill="white" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="72" rx="28" ry="22" />
            <ellipse cx="36" cy="50" rx="11" ry="14" />
            <ellipse cx="84" cy="50" rx="11" ry="14" />
            <ellipse cx="48" cy="38" rx="9" ry="12" />
            <ellipse cx="72" cy="38" rx="9" ry="12" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 flex flex-1 min-h-0 items-center justify-center text-center py-20 md:py-28">
          <div className="max-w-3xl w-full flex flex-col items-center">
            <div className="inline-flex items-center space-x-2 bg-[var(--color-primary)]/25 backdrop-blur-md px-5 py-2 rounded-full text-[var(--color-primary)] font-bold text-sm mb-5 border border-[var(--color-primary)]/40 shadow-sm">
              <Sparkles size={15} />
              <span>Premium Pet Grooming &amp; Care</span>
            </div>

            {/* Customer trust count */}
            <div className="flex items-center gap-2.5 text-white/70 text-sm font-medium mb-6">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/50 border-2 border-white/30 text-xs flex items-center justify-center text-white font-bold">S</div>
                <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/70 border-2 border-white/30 text-xs flex items-center justify-center text-white font-bold">J</div>
                <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/40 border-2 border-white/30 text-xs flex items-center justify-center text-white font-bold">L</div>
              </div>
              <span>Trusted by <strong className="text-white font-extrabold">50,000+</strong> pet owners</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.08] mb-6 max-w-4xl mx-auto px-1 sm:px-0">
              <span className="block">Your pet deserves</span>
              <span className="hero-gradient-heading mt-1 block pb-2">the absolute best.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-medium mb-10 max-w-2xl leading-relaxed">
              Professional-grade grooming tools and pet care essentials — crafted for the comfort and happiness of your furry family.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm sm:max-w-none">
              <Link href="/collections/all">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-base font-bold" leftIcon={<ShoppingBag size={20} />}>
                  Shop Now
                </Button>
              </Link>
              <Link href="/collections/all" className="group inline-flex items-center gap-2 text-white/80 hover:text-white font-semibold text-base transition-colors underline-offset-4 hover:underline">
                See Best Sellers <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
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

      {/* ───── Category Cards ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl pt-14 pb-4">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">Browse by category</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {[
            {
              label: "Nail Care",
              href: "/collections/nail-care",
              bg: "bg-amber-50 dark:bg-amber-950/20",
              iconBg: "bg-[var(--color-primary)]/15",
              iconColor: "text-[var(--color-primary)]",
              icon: <Scissors className="w-6 h-6" />,
            },
            {
              label: "Hair Trimming",
              href: "/collections/hair-trimming",
              bg: "bg-emerald-50 dark:bg-emerald-950/20",
              iconBg: "bg-[var(--color-accent)]/15",
              iconColor: "text-[var(--color-accent)]",
              icon: <Sparkles className="w-6 h-6" />,
            },
            {
              label: "Grooming Kits",
              href: "/collections/grooming-kits",
              bg: "bg-amber-50 dark:bg-amber-950/20",
              iconBg: "bg-[var(--color-primary)]/15",
              iconColor: "text-[var(--color-primary)]",
              icon: <ShoppingBag className="w-6 h-6" />,
            },
            {
              label: "For Dogs",
              href: "/collections/dogs",
              bg: "bg-orange-50 dark:bg-orange-950/20",
              iconBg: "bg-orange-400/15",
              iconColor: "text-orange-500",
              icon: <Heart className="w-6 h-6" />,
            },
            {
              label: "For Cats",
              href: "/collections/cats",
              bg: "bg-purple-50 dark:bg-purple-950/20",
              iconBg: "bg-purple-400/15",
              iconColor: "text-purple-500",
              icon: <Star className="w-6 h-6" />,
            },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className={`group flex flex-col items-center justify-center gap-3 rounded-2xl ${cat.bg} border border-[var(--color-border)] p-5 md:p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--elev-shadow-card-hover)] hover:border-[var(--color-primary)]/30`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.iconBg} ${cat.iconColor}`}>
                {cat.icon}
              </div>
              <span className="text-sm font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── Featured Products ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl pt-16 md:pt-20 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
              <TrendingUp size={12} /> Trending Now
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
            featuredProducts.map((product, index) => {
              const price = parseFloat(product.priceRange.minVariantPrice.amount);
              const formattedPrice = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: product.priceRange.minVariantPrice.currencyCode,
              }).format(price);

              return (
                <div key={product.handle} className="flex flex-col relative">
                  {index === 0 && (
                    <div className="absolute -top-2 left-4 z-10 bg-[var(--color-accent)] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md tracking-wide">
                      #1 BEST SELLER
                    </div>
                  )}
                  <ProductCard
                    handle={product.handle}
                    title={product.title}
                    price={formattedPrice}
                    imageUrl={product.images?.edges[0]?.node?.url || "/product-placeholder.svg"}
                    product={product}
                  />
                  <div className="flex items-center gap-1 justify-center pt-2 text-xs text-slate-500 dark:text-slate-400">
                    <Star size={11} className="fill-[var(--color-primary)] text-[var(--color-primary)]" />
                    <span className="font-semibold text-[var(--color-foreground)]">4.9</span>
                    <span>(2,400+ reviews)</span>
                  </div>
                </div>
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
              icon: <Scissors className="h-8 w-8" />,
              title: "Pro-Grade Tools",
              desc: "Stainless steel blades and precision-engineered clippers trusted by groomers.",
              accentBar: "bg-[var(--color-primary)]",
              iconBg: "icon-bg-primary",
              iconColor: "text-[var(--color-primary)]",
            },
            {
              icon: <Heart className="h-8 w-8" />,
              title: "Pet-Safe Design",
              desc: "Rounded safety tips and low-vibration motors so even anxious pets stay calm.",
              accentBar: "bg-[var(--color-accent)]",
              iconBg: "icon-bg-accent",
              iconColor: "text-[var(--color-accent)]",
            },
            {
              icon: <Zap className="h-8 w-8" />,
              title: "USB Rechargeable",
              desc: "No batteries needed — long-lasting charge for full grooming sessions.",
              accentBar: "bg-[var(--color-primary)]",
              iconBg: "icon-bg-primary",
              iconColor: "text-[var(--color-primary)]",
            },
            {
              icon: <Star className="h-8 w-8" />,
              title: "Loved by Thousands",
              desc: "5-star reviewed products that pet parents come back to again and again.",
              accentBar: "bg-[var(--color-accent)]",
              iconBg: "icon-bg-accent",
              iconColor: "text-[var(--color-accent)]",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group flex flex-col items-start rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 md:p-8 shadow-[var(--elev-shadow-card)] transition-all hover:shadow-[var(--elev-shadow-card-hover)] hover:-translate-y-1"
            >
              <div className={`w-2 h-10 rounded-full mb-5 ${item.accentBar}`} />
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg} ${item.iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
              </div>
              <p className="text-lg font-extrabold text-[var(--color-foreground)] mb-1.5">{item.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Showcase Banner ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl py-6 md:py-10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[var(--color-accent)] shadow-2xl">
          {/* Background image overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1600&auto=format&fit=crop"
              alt="Dog grooming"
              fill
              className="object-cover opacity-15"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch min-h-[420px]">
            {/* Left: text content */}
            <div className="p-8 md:p-14 flex flex-col justify-center">
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
                <Button size="lg" className="w-fit h-13 px-8 font-bold bg-white text-(--color-accent) hover:bg-slate-100 border-none shadow-xl">
                  Explore All Products <ArrowRight size={18} className="ml-1" />
                </Button>
              </Link>

              {/* Stats row */}
              <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-3 gap-4">
                {[
                  { value: "50K+", label: "Happy Pets" },
                  { value: "4.9★", label: "Avg Rating" },
                  { value: "30-Day", label: "Free Returns" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-xl md:text-2xl font-black text-white">{stat.value}</div>
                    <div className="text-xs text-white/70 font-medium mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: full-height image panel */}
            <div className="relative min-h-[280px] md:min-h-full">
              <Image
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=900&auto=format&fit=crop"
                alt="Happy dogs"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ───── Social Proof / Reviews Strip ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-5xl py-16 md:py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20 rounded-2xl px-6 py-4 mb-6">
            <div className="flex gap-0.5">
              {Array.from({length: 5}).map((_, i) => (
                <Star key={i} size={22} className="fill-[var(--color-primary)] text-[var(--color-primary)]" />
              ))}
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-[var(--color-foreground)]">4.9</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">from 2,000+ reviews</div>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[var(--color-foreground)] mb-2">
            What pet parents are saying
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Real reviews from real pet families</p>
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
              className="rounded-3xl border border-[var(--color-border)] border-t-2 border-t-[var(--color-primary)]/30 bg-[var(--color-surface)] p-6 shadow-[var(--elev-shadow-card)]"
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-sm font-extrabold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20">
                  {review.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-[var(--color-foreground)]">{review.name}</p>
                    <BadgeCheck size={13} className="text-[var(--color-accent)]" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{review.pet}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Newsletter ───── */}
      <section className="container mx-auto px-4 md:px-6 max-w-7xl pb-4">
        <div className="newsletter-section p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="md:w-1/2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[var(--color-primary)]/10 rounded-full px-4 py-1.5 text-[var(--color-primary)] text-xs font-bold mb-4 border border-[var(--color-primary)]/20">
              <Sparkles size={12} /> Beepaws Newsletter
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--color-foreground)] mb-4 leading-tight">
              Join the <br className="hidden md:block" />Beepaws Family
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg font-medium max-w-md">
              Sign up today and get <span className="font-extrabold text-[var(--color-primary)]">15% off</span> your first order, plus expert pet care tips delivered weekly.
            </p>
          </div>

          <div className="md:w-1/2 w-full max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 bg-[var(--color-background)] p-2 rounded-2xl sm:rounded-full border border-[var(--color-border)] shadow-[var(--elev-shadow-card)]">
              <input
                type="email"
                placeholder="Your email address"
                className="bg-transparent text-[var(--color-foreground)] placeholder-slate-400 px-5 py-3 flex-grow outline-none font-medium rounded-xl sm:rounded-full min-h-[48px] focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-all"
              />
              <button
                type="button"
                className="bg-[var(--color-primary)] text-white font-extrabold hover:bg-[var(--color-primary-hover)] transition-colors rounded-xl sm:rounded-full px-7 py-3 shrink-0 min-h-[48px] shadow-md"
              >
                Get 15% Off
              </button>
            </div>
            <p className="text-center text-slate-400 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
