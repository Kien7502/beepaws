import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, Package, ShieldCheck, HeartPulse } from 'lucide-react';
import Button from '../ui/Button';

const Footer = () => {
  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 pb-12 border-b border-[var(--color-border)]">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)]">
              <Package size={28} />
            </div>
            <h4 className="font-bold text-[var(--color-foreground)] text-lg">Fast & Free Shipping</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">On all orders over $50</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)]">
              <ShieldCheck size={28} />
            </div>
            <h4 className="font-bold text-[var(--color-foreground)] text-lg">Secure Checkout</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">100% protected payments</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)]">
              <HeartPulse size={28} />
            </div>
            <h4 className="font-bold text-[var(--color-foreground)] text-lg">Loved by Pets</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Only the best for your furry friends</p>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand & Newsletter */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-3xl font-extrabold tracking-tight text-[var(--color-foreground)]">
                Bee<span className="text-[var(--color-primary)]">paws</span>
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm leading-relaxed">
              We provide the highest quality toys, beds, and grooming supplies to keep your pets happy and healthy.
            </p>
            <h4 className="font-bold text-[var(--color-foreground)] mb-3">Subscribe to our newsletter</h4>
            <div className="flex w-full max-w-sm gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-[var(--color-foreground)] placeholder-slate-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/20 transition-all font-medium" 
              />
              <Button>Subscribe</Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="font-bold text-[var(--color-foreground)]">Shop</h4>
            <ul className="space-y-3">
              <li><Link href="/collections/all" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] text-sm transition-colors">All Products</Link></li>
              <li><Link href="/collections/dogs" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] text-sm transition-colors">For Dogs</Link></li>
              <li><Link href="/collections/cats" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] text-sm transition-colors">For Cats</Link></li>
              <li><Link href="/collections/new" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] text-sm transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h4 className="font-bold text-[var(--color-foreground)]">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] text-sm transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] text-sm transition-colors">Shipping Policy</Link></li>
              <li><Link href="/returns" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] text-sm transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/contact" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] text-sm transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © {new Date().getFullYear()} Beepaws. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] dark:hover:text-[var(--color-primary)] transition-colors">
              <Instagram size={24} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] dark:hover:text-[var(--color-primary)] transition-colors">
              <Facebook size={24} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-[var(--color-primary)] dark:hover:text-[var(--color-primary)] transition-colors">
              <Twitter size={24} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
