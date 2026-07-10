"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/types/shopify";
import { useCart } from "@/components/cart/CartProvider";

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(amount);
}

// When the PDP's tier 0 is a real Shopify bundle, the sticky bar prices AND
// adds that bundle (one cart line; Shopify expands the components) so the
// number on the bar always matches what lands in the cart — part of the
// pricing-coherence fix (verification pass §2.1).
type QuickAddBundle = {
  variantId: string;
  variantTitle: string;
  priceAmount: string;
  currencyCode: string;
  available: boolean;
  handle: string;
  title: string;
  imageUrl: string;
  components: { quantity: number; title: string; imageUrl: string | null }[];
};

export function StickyAddToCart({
  product,
  quickAddBundle,
}: {
  product: Product;
  quickAddBundle?: QuickAddBundle | null;
}) {
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem, closeDrawer, drawerOpen } = useCart();

  const variant = product.variants.edges[0]?.node;
  const price = quickAddBundle
    ? parseFloat(quickAddBundle.priceAmount)
    : parseFloat(variant?.price?.amount || "0");
  const currencyCode = quickAddBundle?.currencyCode || variant?.price?.currencyCode || "USD";
  const imageUrl = product.images.edges[0]?.node?.url || "/product-placeholder.svg";
  const isAvailable = quickAddBundle ? quickAddBundle.available : variant?.availableForSale;

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

  function onAdd() {
    if (!isAvailable) return;

    if (quickAddBundle) {
      addItem({
        merchandiseId: quickAddBundle.variantId,
        productHandle: quickAddBundle.handle,
        productTitle: quickAddBundle.title,
        variantTitle: quickAddBundle.variantTitle,
        imageUrl: quickAddBundle.imageUrl || imageUrl,
        currencyCode: quickAddBundle.currencyCode,
        unitPriceAmount: quickAddBundle.priceAmount,
        quantity: 1,
        // Carry the components so the cart line lists what's inside (and the
        // line stays non-linking — bundle PDPs 404 by design).
        bundleComponents: quickAddBundle.components,
      });
    } else {
      if (!variant) return;
      addItem({
        merchandiseId: variant.id,
        productHandle: product.handle,
        productTitle: product.title,
        variantTitle: variant.title,
        imageUrl,
        currencyCode: variant.price.currencyCode,
        unitPriceAmount: variant.price.amount,
        quantity: 1,
      });
    }
    // Don't open the drawer from the sticky bar — let the user stay on the page
    closeDrawer();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div
      // Warm Honey re-skin per plan: paper bg, hairline line border,
      // warm-brown shadow. Hides while the cart drawer is open.
      // pb-[env(safe-area-inset-bottom)] keeps the bar clear of the iPhone
      // home indicator when the page is installed / viewed edge-to-edge.
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_22px_-4px_rgba(74,46,22,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible && !drawerOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 md:px-6">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line">
          <Image src={imageUrl} alt={product.title} fill className="object-cover" sizes="48px" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm md:text-[14.5px] font-extrabold text-cocoa">
            {product.title}
          </p>
          <p className="text-[13px] font-bold text-brown">
            {formatMoney(price, currencyCode)}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={!isAvailable}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-gold px-5 py-3 md:px-7 text-[15px] font-extrabold text-cocoa transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-gold-deep hover:text-white hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <ShoppingBag size={18} />
          {added ? "Added!" : isAvailable ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
