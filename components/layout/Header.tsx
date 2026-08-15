"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X } from "lucide-react";
import { SearchOverlay } from "./SearchOverlay";
import { useCart } from "@/components/cart/CartProvider";
import titleIcon from "@/app/Title_icon.png";

// LAUNCH NAV MODE (2026-07-26). The device launches with essentially one
// product, so a full inline nav reads as empty. Until the spray (and more
// products) are online we ship the MINIMAL bar: menu button + centered logo +
// search + cart, with the real links (Shop / FAQ / Contact) in the menu panel.
// Flip to `true` to reveal the conventional inline desktop nav — built and
// ready, just dormant. Owner is sending a visual reference; styling here is
// deliberately restrained (Warm Honey tokens, no heavy art direction) pending
// that, so it re-skins cleanly.
const SHOW_FULL_NAV = false;

// Category links return when the dogs/cats collections are populated in
// Shopify — live-checked 2026-07-09: with today's catalog they render EMPTY
// collection pages, so they're gated off rather than dead-ending a first-time
// visitor (same staged-content pattern as the homepage's SHOW_GROOMING).
// Footer.tsx carries the same flag — flip BOTH together.
const SHOW_CATEGORY_LINKS = false;

// Inline desktop nav (full mode only) — the wayfinding shown beside the logo.
const navLinks = [
  { href: "/collections/all", label: "Shop All" },
  ...(SHOW_CATEGORY_LINKS
    ? [
        { href: "/collections/dogs", label: "Dogs" },
        { href: "/collections/cats", label: "Cats" },
      ]
    : []),
  { href: "/faq", label: "FAQ" },
];

// Menu-panel links (mobile always; desktop in minimal mode). This is the ONLY
// wayfinding on screen in minimal mode, so it carries the support pages too.
const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/collections/all", label: "Shop All" },
  ...(SHOW_CATEGORY_LINKS
    ? [
        { href: "/collections/dogs", label: "Dogs" },
        { href: "/collections/cats", label: "Cats" },
      ]
    : []),
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

function navLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/collections/all") {
    return pathname === "/collections/all" || pathname.startsWith("/products/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount, hydrated, lastAddedAt, lastAddedQuantity, openDrawer } = useCart();
  const [showCartPulse, setShowCartPulse] = useState(false);

  useEffect(() => {
    if (!lastAddedAt) return;
    setShowCartPulse(true);
    const t = window.setTimeout(() => setShowCartPulse(false), 850);
    return () => window.clearTimeout(t);
  }, [lastAddedAt]);

  // Close the menu on navigation (route change).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    // Warm Honey re-skin: paper bg + hairline border (no shadow). Sticky stays.
    <header className="sticky top-0 z-50 w-full bg-paper border-b border-line">
      {/* Announcement bar — cocoa per reference. Keep the existing honest
          "free shipping" copy (hard rule: no fake countdowns). */}
      <div className="bg-cocoa text-cream text-xs md:text-sm font-medium py-2.5 text-center tracking-wide px-2">
        Free shipping on orders over <b className="text-gold">$50</b> —{" "}
        <Link href="/collections/all" className="underline underline-offset-2 font-semibold hover:text-gold transition-colors">
          Shop now
        </Link>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-[68px]">
          {/* Left: menu button. Always visible in minimal mode; mobile-only in
              full mode (desktop uses the inline nav instead). */}
          <div className={`flex flex-1 items-center ${SHOW_FULL_NAV ? "md:flex-none" : ""}`}>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className={`p-2 text-cocoa hover:bg-honey-tint rounded-full transition-colors ${
                SHOW_FULL_NAV ? "md:hidden" : ""
              }`}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo: centered in minimal mode (all breakpoints); left-aligned on
              desktop in full mode. */}
          <div className={`flex-1 text-center ${SHOW_FULL_NAV ? "md:flex-none md:text-left" : ""}`}>
            <Link href="/" className="inline-block">
              <Image
                src={titleIcon}
                alt="Beepaws"
                className="h-9 w-auto md:h-11"
                priority
              />
            </Link>
          </div>

          {/* Inline desktop nav — full mode only. */}
          {SHOW_FULL_NAV && (
            <nav className="hidden md:flex flex-1 justify-center items-center gap-7">
              {navLinks.map((link) => {
                const active = navLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[14.5px] font-semibold transition-colors relative py-1 ${
                      active
                        ? "text-clay after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-clay"
                        : "text-brown hover:text-gold-deep"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right: search + cart. */}
          <div className="flex-1 flex items-center justify-end gap-1 md:gap-3">
            <SearchOverlay />
            <button
              type="button"
              onClick={openDrawer}
              className={`relative p-2 text-cocoa hover:bg-honey-tint rounded-full transition-colors inline-flex ${
                showCartPulse ? "scale-110 bg-gold/15 ring-2 ring-gold/35" : ""
              }`}
              aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            >
              <ShoppingCart size={24} />
              {hydrated && itemCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-clay px-1 text-xs font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
              {showCartPulse && (
                <span className="absolute -bottom-7 right-0 rounded-full bg-positive px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
                  +{lastAddedQuantity}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu panel — mobile always; also desktop in minimal mode (it's the only
          wayfinding there). */}
      {mobileOpen && (
        <div
          className={`border-t border-line bg-paper px-4 py-4 space-y-1 shadow-lg ${
            SHOW_FULL_NAV ? "md:hidden" : ""
          }`}
        >
          {menuLinks.map((link) => {
            const active = navLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-xl px-4 py-3 text-base font-semibold ${
                  active
                    ? "text-clay bg-honey-tint/60"
                    : "text-cocoa hover:bg-honey-tint/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => { setMobileOpen(false); openDrawer(); }}
            className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-cocoa hover:bg-honey-tint/80"
          >
            Cart {hydrated && itemCount > 0 && `(${itemCount})`}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
