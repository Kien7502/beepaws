"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { SearchOverlay } from "./SearchOverlay";
import { useCart } from "@/components/cart/CartProvider";

const navLinks = [
  { href: "/collections/all", label: "Shop All" },
  { href: "/collections/dogs", label: "Dogs" },
  { href: "/collections/cats", label: "Cats" },
];

function navLinkActive(pathname: string, href: string): boolean {
  if (href === "/collections/all") {
    return (
      pathname === "/collections/all" || pathname.startsWith("/products/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount, hydrated } = useCart();
  const cartHref = "/checkout";

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
            {navLinks.map((link) => {
              const active = navLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors relative py-1 ${
                    active
                      ? "text-[var(--color-primary)] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[var(--color-primary)]"
                      : "text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1 flex items-center justify-end gap-1 md:gap-3">
            <ThemeToggle />
            <SearchOverlay />
            <Link
              href={cartHref}
              className="relative p-2 text-[var(--color-foreground)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors inline-flex"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={24} />
              {hydrated && itemCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-xs font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--background)] px-4 py-4 space-y-1 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`block rounded-xl px-4 py-3 text-base font-semibold ${
              pathname === "/"
                ? "text-[var(--color-primary)] bg-[var(--color-secondary)]/50 dark:bg-slate-800"
                : "text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]/80 dark:hover:bg-slate-800/80"
            }`}
          >
            Home
          </Link>
          {navLinks.map((link) => {
            const active = navLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-xl px-4 py-3 text-base font-semibold ${
                  active
                    ? "text-[var(--color-primary)] bg-[var(--color-secondary)]/50 dark:bg-slate-800"
                    : "text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]/80 dark:hover:bg-slate-800/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href={cartHref}
            onClick={() => setMobileOpen(false)}
            className="block rounded-xl px-4 py-3 text-base font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]/80 dark:hover:bg-slate-800/80"
          >
            Cart
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
