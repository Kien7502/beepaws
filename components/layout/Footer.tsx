import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import titleIcon from '@/app/Title_icon.png';

const Footer = () => {
  // Warm Honey re-skin: footer is the one deliberate green moment per the
  // plan — moss bg with a 3px sage top stripe. Wave divider flows from
  // cream (matches the FAQ section above) into moss. marginTop:"-16px" and
  // the cream gap-fill bg stay — they hide any subpixel compositor seam
  // between the FAQ wave and the footer block.
  return (
    <footer style={{ marginTop: "-16px", position: "relative", zIndex: 1, background: "#FBF3E1" }}>
      <WaveDivider from="#FBF3E1" to="#2F3B2A" />
      {/* 3px sage stripe as the fusion accent. marginTop:"-8px" overlaps the
          wave bottom so the moss bg starts flush. */}
      <div
        className="bg-moss border-t-[3px] border-sage pb-24"
        style={{ marginTop: "-8px", position: "relative", zIndex: 1 }}
      >
        <div className="container mx-auto px-4 md:px-6 pt-10">

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand & Newsletter */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Image src={titleIcon} alt="Beepaws" className="h-9 w-auto" />
              </Link>
              <p className="text-[#B0A88F] mb-6 max-w-sm leading-relaxed">
                We provide the highest quality toys, beds, and grooming supplies to keep your pets happy and healthy.
              </p>
              <h4 className="font-bold text-[#E7E3D3] uppercase text-[13px] tracking-wider mb-3">
                Subscribe to our newsletter
              </h4>
              <div className="flex w-full max-w-sm gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border-2 border-white/15 bg-white/8 px-5 py-3 text-white placeholder-white/40 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/25 transition-all font-medium"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-gold px-5 py-3 font-bold text-cocoa transition-colors hover:bg-gold-deep hover:text-white"
                >
                  Subscribe
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-bold text-[#E7E3D3] uppercase text-[13px] tracking-wider">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/collections/all" className="text-[#B0A88F] hover:text-gold text-sm transition-colors">All products</Link></li>
                <li><Link href="/collections/dogs" className="text-[#B0A88F] hover:text-gold text-sm transition-colors">For Dogs</Link></li>
                <li><Link href="/collections/cats" className="text-[#B0A88F] hover:text-gold text-sm transition-colors">For Cats</Link></li>
                <li><Link href="/collections/new" className="text-[#B0A88F] hover:text-gold text-sm transition-colors">New Arrivals</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-bold text-[#E7E3D3] uppercase text-[13px] tracking-wider">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-[#B0A88F] hover:text-gold text-sm transition-colors">FAQ</Link></li>
                <li><Link href="/shipping" className="text-[#B0A88F] hover:text-gold text-sm transition-colors">Shipping Policy</Link></li>
                <li><Link href="/returns" className="text-[#B0A88F] hover:text-gold text-sm transition-colors">Returns & Refunds</Link></li>
                <li><Link href="/contact" className="text-[#B0A88F] hover:text-gold text-sm transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-[#3E4B38] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#A8A48F] text-xs">
              © {new Date().getFullYear()} Beepaws. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#A8A48F] hover:text-gold transition-colors">
                <Instagram size={22} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#A8A48F] hover:text-gold transition-colors">
                <Facebook size={22} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[#A8A48F] hover:text-gold transition-colors">
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
