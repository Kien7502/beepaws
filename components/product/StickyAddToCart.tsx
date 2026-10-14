"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/types/shopify";
import { useCart } from "@/components/cart/CartProvider";
import { prefersReducedMotion } from "@/lib/motion";
import { useBuyBox } from "./BuyBoxSync";

/**
 * The floating add-to-cart bar. It MIRRORS the buy box (owner, 2026-10-11): it
 * shows what the buy box's own button would add — the chosen kit, its colours
 * or flavours, and the same total — and its button runs that same add (both via
 * BuyBoxSync). It used to add the product's first variant on its own, a white
 * device at the base price, whatever the shopper had picked above.
 *
 * When the buy box has nothing addable (no quantity chosen, or sold out), the
 * button takes the shopper back to it instead of sitting there disabled.
 */
export function StickyAddToCart({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);
  const { closeDrawer, drawerOpen } = useCart();
  const { summary, add } = useBuyBox();

  useEffect(() => {
    // Watch the Add-to-cart button itself, not a zero-height sentinel —
    // matches the reference template's scroll handler exactly. Reveal sticky
    // the moment the trigger button's bottom edge passes viewport top.
    // Scroll listener (vs IntersectionObserver) because IO on zero-or-small
    // targets is flaky across browsers; a `passive: true` scroll handler is
    // cheap and predictable.
    const trigger = document.getElementById("sticky-cta-trigger");
    if (!trigger) return;

    function check() {
      if (!trigger) return;
      setVisible(trigger.getBoundingClientRect().bottom < 0);
    }

    check(); // initialize for the case where the page loads scrolled past the trigger
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  if (!summary) return null;

  const imageUrl = summary.imageUrl || product.images.edges[0]?.node?.url || "/product-placeholder.svg";
  const shown = visible && !drawerOpen;

  function onAdd() {
    if (!summary?.available) {
      document
        .getElementById("buy-box")
        ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      return;
    }
    add();
    // The buy box's add opens the cart drawer; from the bar, stay on the page
    // (the header's cart icon pulses instead).
    closeDrawer();
  }

  return (
    <div
      // Warm Honey re-skin per plan: paper bg, hairline line border,
      // warm-brown shadow. Hides while the cart drawer is open, and is inert
      // while hidden so keyboard focus can't land on an off-screen button.
      // pb-[env(safe-area-inset-bottom)] keeps the bar clear of the iPhone
      // home indicator when the page is installed / viewed edge-to-edge.
      inert={!shown}
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_22px_-4px_rgba(74,46,22,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 md:px-6">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line">
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="48px" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-cocoa">{summary.title}</p>
          <p className="truncate text-[13px] text-brown">
            <span className="font-bold">{summary.price}</span>
            {summary.detail && <span> · {summary.detail}</span>}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-gold px-5 py-3 md:px-7 text-[15px] font-extrabold text-cocoa transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-gold-deep hover:text-white hover:-translate-y-0.5 shadow-sm"
        >
          {summary.available ? (
            // Both faces share one grid cell, so the button keeps the width of
            // the wider one and the label cross-fades instead of the button
            // resizing under the thumb (owner, 2026-10-11).
            <span className="grid">
              <span
                aria-hidden={summary.added}
                className={`col-start-1 row-start-1 flex items-center justify-center gap-2 transition-opacity duration-150 ${summary.added ? "opacity-0" : ""}`}
              >
                <ShoppingBag size={18} />
                Add to cart
              </span>
              <span
                aria-hidden={!summary.added}
                className={`col-start-1 row-start-1 flex items-center justify-center gap-2 transition-opacity duration-150 ${summary.added ? "" : "opacity-0"}`}
              >
                <Check size={18} />
                Added!
              </span>
            </span>
          ) : (
            <>
              <ShoppingBag size={18} />
              Choose options
            </>
          )}
        </button>
      </div>
    </div>
  );
}
