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

export function StickyAddToCart({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const variant = product.variants.edges[0]?.node;
  const price = parseFloat(variant?.price?.amount || "0");
  const currencyCode = variant?.price?.currencyCode || "USD";
  const imageUrl = product.images.edges[0]?.node?.url || "/product-placeholder.svg";
  const isAvailable = variant?.availableForSale;

  useEffect(() => {
    const sentinel = document.getElementById("sticky-cta-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function onAdd() {
    if (!variant || !isAvailable) return;
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
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--background)] shadow-[0_-4px_24px_-8px_rgb(61_36_0/0.12)] transition-transform duration-300 ease-in-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-[var(--color-border)]">
          <Image src={imageUrl} alt={product.title} fill className="object-cover" sizes="48px" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--color-foreground)]">
            {product.title}
          </p>
          <p className="text-sm font-extrabold text-[var(--color-primary)]">
            {formatMoney(price, currencyCode)}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={!isAvailable}
          className="flex shrink-0 items-center gap-2 bg-[var(--color-primary)] px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          <ShoppingBag size={16} />
          {added ? "Added!" : isAvailable ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
