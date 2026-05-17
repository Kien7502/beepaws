"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export function ScrollToTopButton() {
  const [scrolled, setScrolled] = useState(false);
  const { drawerOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hidden when cart drawer is open — z-index alone can't satisfy "above
  // sticky add-to-cart (z-50) AND below cart backdrop (z-40)", so we drop
  // out of the layer entirely while the drawer is up.
  const visible = scrolled && !drawerOpen;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        pointerEvents: visible ? "auto" : "none",
      }}
      // z-[60] sits above StickyAddToCart (z-50); the drawerOpen guard above
      // makes the cart-backdrop conflict moot.
      className="fixed bottom-24 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg text-[var(--color-accent)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-300 md:bottom-8 md:right-6"
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  );
}
