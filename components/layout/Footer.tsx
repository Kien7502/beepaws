'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import titleIcon from '@/app/Title_icon.png';

const Footer = () => {
  // Forest re-theme (experiment/skill-design-taste): footer block is the deep
  // forest green from the homepage sections (#15241A), with an amber accent
  // (#E0892F) matching the page's single accent.
  //
  // The wave's CAP (the band above the crest + the -16px overlap strip) must
  // match the section ABOVE the footer so the wave reads as a transition INTO
  // the footer, not a hard seam. That section differs by page and the footer is
  // shared, so the cap is route-aware: the Forest homepage ends on the off-white
  // page bg; every other (Warm Honey) page ends on the bark Final CTA. The
  // slower back ripples (#2E5440) tint the transition; the front curve (#15241A)
  // melts into the forest block.
  const FOREST = '#15241A';
  const pathname = usePathname();
  // Homepage now sits on the Warm Honey cream base (#FBF3E1); match the cap to it.
  const cap = pathname === '/' ? '#FBF3E1' : '#5E3C22';
  return (
    <footer style={{ marginTop: "-16px", position: "relative", zIndex: 1, background: cap }}>
      <WaveDivider from={cap} to="#2E5440" frontColor={FOREST} flip />
      <div
        className="pb-24"
        style={{ marginTop: "-8px", position: "relative", zIndex: 1, background: FOREST }}
      >
        <div className="container mx-auto px-4 md:px-6 pt-10">

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand & Newsletter */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Image src={titleIcon} alt="Beepaws" className="h-9 w-auto" />
              </Link>
              <p className="text-[#A7B6A0] mb-6 max-w-sm leading-relaxed">
                BeePaws makes at-home pet wellness tools, dental and grooming, honestly priced against the real alternatives. No fake urgency, no hidden ingredients, no clinical trials we did not run.
              </p>
              <h4 className="font-bold text-[#EDF0E9] uppercase text-[13px] tracking-wider mb-3">
                Subscribe to our newsletter
              </h4>
              <div className="flex w-full max-w-sm gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border-2 border-white/15 bg-white/8 px-5 py-3 text-white placeholder-white/40 focus:border-[#E0892F] focus:outline-none focus:ring-4 focus:ring-[#E0892F]/25 transition-all font-medium"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-[#E0892F] px-5 py-3 font-bold text-[#15241A] transition-colors hover:bg-[#C2731E] hover:text-white"
                >
                  Subscribe
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-bold text-[#EDF0E9] uppercase text-[13px] tracking-wider">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/collections/all" className="text-[#A7B6A0] hover:text-[#E0892F] text-sm transition-colors">All products</Link></li>
                <li><Link href="/collections/dogs" className="text-[#A7B6A0] hover:text-[#E0892F] text-sm transition-colors">For Dogs</Link></li>
                <li><Link href="/collections/cats" className="text-[#A7B6A0] hover:text-[#E0892F] text-sm transition-colors">For Cats</Link></li>
                <li><Link href="/collections/new" className="text-[#A7B6A0] hover:text-[#E0892F] text-sm transition-colors">New Arrivals</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-bold text-[#EDF0E9] uppercase text-[13px] tracking-wider">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-[#A7B6A0] hover:text-[#E0892F] text-sm transition-colors">FAQ</Link></li>
                <li><Link href="/shipping" className="text-[#A7B6A0] hover:text-[#E0892F] text-sm transition-colors">Shipping Policy</Link></li>
                <li><Link href="/returns" className="text-[#A7B6A0] hover:text-[#E0892F] text-sm transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/contact" className="text-[#A7B6A0] hover:text-[#E0892F] text-sm transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-[#335042] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#8F9C88] text-xs">
              © {new Date().getFullYear()} Beepaws. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#8F9C88] hover:text-[#E0892F] transition-colors">
                <Instagram size={22} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#8F9C88] hover:text-[#E0892F] transition-colors">
                <Facebook size={22} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[#8F9C88] hover:text-[#E0892F] transition-colors">
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
