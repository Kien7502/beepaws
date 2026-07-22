'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import titleIcon from '@/app/Title_icon.png';

// Paired with Header.tsx's flag of the same name — flip BOTH together when
// the dogs/cats collections are populated.
const SHOW_CATEGORY_LINKS = false;

const Footer = () => {
  // Palette pass 2026-07-21: the footer was deep forest green (#15241A), the
  // last survivor of the abandoned Forest re-theme. Nothing else on the site
  // was green, so it read as a different site's footer, and green now means
  // "botanical" (see globals.css). The footer is COCOA — the deepest warm
  // brown — so the page still ends on a dark full-stop, one step deeper than
  // the bark closing band above it on the PDP.
  //
  // The wave's CAP (the band above the crest + the -16px overlap strip) must
  // match the section ABOVE the footer so the wave reads as a transition INTO
  // the footer, not a hard seam. Route-aware again since the flow rework
  // (2026-07-10) cut the homepage's bark promise band: '/' now ends on the
  // cream product spotlight; every other page still ends on a bark band (the
  // PDP Final CTA). The back ripples are bark, so the wave DEEPENS
  // bark → cocoa instead of switching hue mid-transition.
  //
  // Tokens, not hex: the footer follows the seasonal skin like everything else.
  const FOOTER_BG = 'var(--cocoa)';
  const pathname = usePathname();
  const cap = pathname === '/' ? 'var(--cream)' : 'var(--bark)'; // cream on /, bark elsewhere
  return (
    <footer style={{ marginTop: "-16px", position: "relative", zIndex: 1, background: cap }}>
      <WaveDivider from={cap} to="var(--bark)" frontColor={FOOTER_BG} flip />
      <div
        className="pb-24"
        style={{ marginTop: "-8px", position: "relative", zIndex: 1, background: FOOTER_BG }}
      >
        <div className="container mx-auto px-4 md:px-6 pt-10">

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand & Newsletter */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Image src={titleIcon} alt="Beepaws" className="h-9 w-auto" />
              </Link>
              {/* Category-neutral on purpose: no grooming mention while that
                  line is unlaunched (never-tease rule; deliberate deviation
                  from audit §11.1's "dental and grooming" wording). "No
                  invented stats" per v2 §1.2 — the old "no clinical trials we
                  did not run" double-negative misread as "we run no trials". */}
              <p className="text-cream/75 mb-6 max-w-sm leading-relaxed">
                BeePaws makes at-home pet wellness tools, honestly priced against the real alternatives. No fake urgency, no hidden ingredients, no invented stats.
              </p>
              <h4 className="font-bold text-cream uppercase text-[13px] tracking-wider mb-3">
                Subscribe to our newsletter
              </h4>
              <div className="flex w-full max-w-sm gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border-2 border-white/15 bg-white/8 px-5 py-3 text-white placeholder-white/55 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/25 transition-all font-medium"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-gold px-5 py-3 font-bold text-cocoa transition-colors hover:bg-gold-deep"
                >
                  Subscribe
                </button>
              </div>
            </div>

            {/* Quick Links. Dogs/Cats return when their collections are
                populated in Shopify (they rendered EMPTY pages with today's
                catalog — Header.tsx carries the same flag, flip BOTH).
                "New Arrivals" was dropped outright: meaningless until the
                catalog is big enough for recency to be a real facet. */}
            <div className="space-y-4">
              <h4 className="font-bold text-cream uppercase text-[13px] tracking-wider">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/collections/all" className="text-cream/75 hover:text-gold text-sm transition-colors">All products</Link></li>
                {SHOW_CATEGORY_LINKS && (
                  <>
                    <li><Link href="/collections/dogs" className="text-cream/75 hover:text-gold text-sm transition-colors">For Dogs</Link></li>
                    <li><Link href="/collections/cats" className="text-cream/75 hover:text-gold text-sm transition-colors">For Cats</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-bold text-cream uppercase text-[13px] tracking-wider">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-cream/75 hover:text-gold text-sm transition-colors">FAQ</Link></li>
                <li><Link href="/shipping" className="text-cream/75 hover:text-gold text-sm transition-colors">Shipping Policy</Link></li>
                <li><Link href="/returns" className="text-cream/75 hover:text-gold text-sm transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/contact" className="text-cream/75 hover:text-gold text-sm transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-cream/15 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-cream/60 text-xs">
              © {new Date().getFullYear()} Beepaws. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-cream/60 hover:text-gold transition-colors">
                <Instagram size={22} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-cream/60 hover:text-gold transition-colors">
                <Facebook size={22} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-cream/60 hover:text-gold transition-colors">
                <Twitter size={22} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
