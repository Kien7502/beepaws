import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import { Sparkles, ShoppingBag } from 'lucide-react';

import { getProducts } from '@/lib/shopify/queries';

export default async function Home() {
  const products = await getProducts();
  // Get just the first 4 for the featured section
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="flex flex-col w-full pb-20">
      
      {/* Hero Banner Section */}
      <section className="relative w-full min-h-[min(90vh,880px)] overflow-hidden flex flex-col">
        {/* Background Color/Pattern Base */}
        <div className="absolute inset-0 bg-slate-950 z-0">
          <img 
            src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=2000&auto=format&fit=crop" 
            alt="Happy pets" 
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 flex flex-1 min-h-0 items-center justify-center text-center py-16 md:py-24">
          <div className="max-w-3xl w-full flex flex-col items-center">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full text-white font-bold text-sm mb-6 sm:mb-8 border border-white/30 shadow-sm">
              <Sparkles size={16} />
              <span>Premium Pet Care</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.08] mb-6 max-w-4xl mx-auto px-1 sm:px-0 break-words">
              <span className="block">Your pet deserves</span>
              <span className="hero-gradient-heading mt-1 block pb-1">the absolute best.</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/90 font-medium mb-10 max-w-2xl leading-relaxed">
              Discover meticulous care and joyful products tailored to the ultimate comfort of your furry friends. 
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
              <Link href="/collections/all">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg" leftIcon={<ShoppingBag size={22} />}>
                  Shop Now
                </Button>
              </Link>
              <Link href="/collections/dogs">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-black/40 text-white border-2 border-white/60 hover:bg-black/60 hover:border-white transition-all backdrop-blur-md">
                  Explore Best Sellers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-foreground)] mb-4">
              Pawsitively Perfect Picks
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Hand-selected favorites that your pets will obsess over. Grooming, playing, and relaxing made better.
            </p>
          </div>
          <Link href="/collections/all" className="mt-6 md:mt-0 text-[var(--color-primary)] font-bold hover:underline hidden md:inline-flex items-center">
            View All Products
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>

        {/* Product Grid Dynamic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {featuredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 px-4 bg-[var(--color-secondary)]/10 dark:bg-slate-800/30 backdrop-blur-sm border-2 border-dashed border-[var(--color-primary)]/20 rounded-[2rem] text-center max-w-xl mx-auto">
              <span className="text-5xl mb-4 opacity-80" aria-hidden>🐾</span>
              <p className="text-[var(--color-foreground)] font-black text-xl mb-2">No featured products yet</p>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                Connect your Shopify catalog or browse the shop when demo data is available.
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
                  imageUrl={product.images?.edges[0]?.node?.url || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop'}
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
      
      {/* Featured Banner Mini (Newsletter) */}
      <section className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden">
          
          {/* Decorative shapes behind text */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          <div className="md:w-1/2 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Join the <br/>Beepaws Family
            </h2>
            <p className="text-white/90 mb-10 text-lg md:text-xl font-medium max-w-md">
              Sign up today and get <span className="font-bold text-yellow-300">15% off</span> your first accessory order, plus exclusive members-only tips for pet care.
            </p>
            <div className="flex flex-col sm:flex-row w-full max-w-md gap-2 sm:gap-3 bg-white/10 p-2 rounded-3xl sm:rounded-full border border-white/20 backdrop-blur-md">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-transparent text-white placeholder-white/70 px-5 sm:px-6 py-3 flex-grow outline-none font-medium rounded-2xl sm:rounded-full min-h-[48px]" 
              />
              <button type="button" className="bg-white text-[var(--color-primary)] font-bold hover:bg-slate-100 transition-colors border-none rounded-2xl sm:rounded-full px-8 py-3 shrink-0 min-h-[48px]">
                Join now
              </button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center relative z-10">
            <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
               <img src="https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Cute dog"/>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
