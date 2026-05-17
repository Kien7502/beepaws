import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import titleIcon from '@/app/Title_icon.png';

const Footer = () => {
  return (
    // marginTop:"-16px" overlaps the FAQ section bottom; background:"#FFF5E4" gap-fills any compositor seam
    <footer style={{ marginTop: "-16px", position: "relative", zIndex: 1, background: "#FFF5E4" }}>
      <WaveDivider from="#FFF5E4" to="#14380c" />
      {/* marginTop:"-8px" overlaps the wave bottom so the dark bg starts flush */}
      <div className="bg-[#14380c] pb-24" style={{ marginTop: "-8px", position: "relative", zIndex: 1 }}>
        <div className="container mx-auto px-4 md:px-6 pt-10">

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand & Newsletter */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Image src={titleIcon} alt="Beepaws" className="h-9 w-auto" />
              </Link>
              <p className="text-white/60 mb-6 max-w-sm leading-relaxed">
                We provide the highest quality toys, beds, and grooming supplies to keep your pets happy and healthy.
              </p>
              <h4 className="font-bold text-white mb-3">Subscribe to our newsletter</h4>
              <div className="flex w-full max-w-sm gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border-2 border-white/20 bg-white/10 px-5 py-3 text-white placeholder-white/40 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/20 transition-all font-medium"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-full px-5 py-3 font-bold text-white transition-colors hover:opacity-90"
                  style={{ background: "var(--color-brand-gold)" }}
                >
                  Subscribe
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h4 className="font-bold text-white">Shop</h4>
              <ul className="space-y-3">
                <li><Link href="/collections/all" className="text-white/60 hover:text-[var(--color-primary)] text-sm transition-colors">All products</Link></li>
                <li><Link href="/collections/dogs" className="text-white/60 hover:text-[var(--color-primary)] text-sm transition-colors">For Dogs</Link></li>
                <li><Link href="/collections/cats" className="text-white/60 hover:text-[var(--color-primary)] text-sm transition-colors">For Cats</Link></li>
                <li><Link href="/collections/new" className="text-white/60 hover:text-[var(--color-primary)] text-sm transition-colors">New Arrivals</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-6">
              <h4 className="font-bold text-white">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/faq" className="text-white/60 hover:text-[var(--color-primary)] text-sm transition-colors">FAQ</Link></li>
                <li><Link href="/shipping" className="text-white/60 hover:text-[var(--color-primary)] text-sm transition-colors">Shipping Policy</Link></li>
                <li><Link href="/returns" className="text-white/60 hover:text-[var(--color-primary)] text-sm transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-[var(--color-primary)] text-sm transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Beepaws. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[var(--color-primary)] transition-colors">
                <Instagram size={24} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[var(--color-primary)] transition-colors">
                <Facebook size={24} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[var(--color-primary)] transition-colors">
                <Twitter size={24} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
