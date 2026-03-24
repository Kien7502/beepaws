"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

const navLinks = [
  { href: "/collections/all", label: "Shop All" },
  { href: "/collections/dogs", label: "Dogs" },
  { href: "/collections/cats", label: "Cats" },
];

const DemoCartCount = 3;

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="bg-[var(--color-primary)] text-white text-xs md:text-sm font-medium py-2.5 text-center tracking-wide px-2">
        Free shipping on orders over $50 —{" "}
        <Link href="/collections/all" className="underline underline-offset-2 font-semibold">
          Shop now
        </Link>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex flex-1 items-center md:flex-none">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 text-[var(--color-foreground)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors md:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="flex-1 md:flex-none text-center md:text-left">
            <Link href="/" className="inline-block">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-foreground)]">
                Bee<span className="text-[var(--color-primary)]">paws</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 flex items-center justify-end gap-1 md:gap-3">
            <ThemeToggle />
            <button
              type="button"
              className="p-2 text-[var(--color-foreground)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden md:inline-flex"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <Link
              href="/checkout"
              className="relative p-2 text-[var(--color-foreground)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors inline-flex"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={24} />
              <span className="absolute top-0 right-0 inline-flex min-w-[1.25rem] h-5 px-1 items-center justify-center text-[10px] font-bold text-white bg-[var(--color-primary)] rounded-full border-2 border-[var(--background)]">
                {DemoCartCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--background)] px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-base font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]/80 dark:hover:bg-slate-800/80"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
