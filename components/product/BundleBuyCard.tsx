"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Tag } from "lucide-react";
import type { Product } from "@/types/shopify";
import Button from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  currentProduct: Product;
  products: Product[];
};

function getPrimaryVariant(product: Product) {
  return product.variants.edges[0]?.node;
}

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(amount);
}

function getImageUrl(product: Product) {
  return product.images.edges[0]?.node?.url || "/product-placeholder.svg";
}

export function BundleBuyCard({ currentProduct, products }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(products.map((p) => [p.handle, true])),
  );
  const { addItem } = useCart();
  const [addedCount, setAddedCount] = useState(0);
  const [buyingNow, setBuyingNow] = useState(false);

  // Reset stuck "Redirecting…" state after bfcache restore from Shopify back nav.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) setBuyingNow(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const currentVariant = getPrimaryVariant(currentProduct);
  const currencyCode = currentVariant?.price.currencyCode || "USD";
  const currentAmount = Number(currentVariant?.price.amount || 0);

  const selectedProducts = products.filter((p) => selected[p.handle]);

  const bundleTotal = (() => {
    return selectedProducts.reduce((sum, p) => {
      const v = getPrimaryVariant(p);
      return sum + Number(v?.price.amount || 0);
    }, 0);
  })();

  const total = currentAmount + bundleTotal;
  const itemCount = selectedProducts.length + 1;
  const canAdd = !!currentVariant?.availableForSale;

  function onAddBundle() {
    if (!currentVariant || !currentVariant.availableForSale) return;
    let inserted = 0;


    addItem({
      merchandiseId: currentVariant.id,
      productHandle: currentProduct.handle,
      productTitle: currentProduct.title,
      variantTitle: currentVariant.title,
      imageUrl: getImageUrl(currentProduct),
      currencyCode: currentVariant.price.currencyCode,
      unitPriceAmount: currentVariant.price.amount,
      quantity: 1,
    });
    inserted = 1;
    for (const product of selectedProducts) {
      const variant = getPrimaryVariant(product);
      if (!variant || !variant.availableForSale) continue;
      addItem({
        merchandiseId: variant.id,
        productHandle: product.handle,
        productTitle: product.title,
        variantTitle: variant.title,
        imageUrl: getImageUrl(product),
        currencyCode: variant.price.currencyCode,
        unitPriceAmount: variant.price.amount,
        quantity: 1,
      });
      inserted += 1;
    }
    setAddedCount(inserted);
    window.setTimeout(() => setAddedCount(0), 2500);
  }

  async function onBuyNow() {
    if (!canAdd || buyingNow) return;
    setBuyingNow(true);
    // Build the cart lines from selected products + current + their primary
    // variants — same composition as onAddBundle but skip the local cart
    // round-trip and go straight to Shopify checkout.
    try {
      const lines: { merchandiseId: string; quantity: number }[] = [];
      if (currentVariant?.availableForSale) {
        lines.push({ merchandiseId: currentVariant.id, quantity: 1 });
      }
      for (const product of selectedProducts) {
        const variant = getPrimaryVariant(product);
        if (variant?.availableForSale) {
          lines.push({ merchandiseId: variant.id, quantity: 1 });
        }
      }
      const res = await fetch("/api/shopify/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Couldn't open checkout");
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setBuyingNow(false);
    }
  }

  if (products.length === 0) return null;

  const allItems = [currentProduct, ...products];

  // Warm Honey re-skin. Card = white on cream-tint header strip. Selection
  // uses clay accent for the active thumb border + check, gold-deep accent
  // line on the totals row, and a gold "Add bundle" CTA over cocoa outline
  // "Buy now". Phase 4 will add the $1,400 vet-price anchor; for now the
  // structure and metafield wiring stay identical.
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line bg-honey-tint/50 px-4 py-3">
        <Tag className="h-4 w-4 text-gold-deep" aria-hidden />
        <p className="text-sm font-bold uppercase tracking-wider text-cocoa">
          Frequently Bought Together
        </p>
      </div>

      {/* Product images row */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-4 sm:gap-2">
        {allItems.map((product, idx) => {
          const isAddon = idx > 0;
          const isChecked = !isAddon || selected[product.handle];
          return (
            <div key={product.id} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {idx > 0 && (
                <Plus
                  className="h-3.5 w-3.5 shrink-0 text-brown/50"
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (!isAddon) return;
                  setSelected((prev) => ({
                    ...prev,
                    [product.handle]: !prev[product.handle],
                  }));
                }}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${
                  isChecked
                    ? "border-clay opacity-100"
                    : "border-line opacity-40"
                } ${isAddon ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                aria-label={isAddon ? `Toggle ${product.title}` : product.title}
              >
                <Image
                  src={getImageUrl(product)}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {isChecked && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-clay text-white shadow">
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Product list with checkboxes */}
      <ul className="divide-y divide-line/60 px-4">
        {/* Current product (always selected) */}
        <li className="flex items-center gap-3 py-2.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-clay bg-clay">
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-cocoa">
              This item — {currentProduct.title}
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold text-cocoa">
            {formatMoney(currentAmount, currencyCode)}
          </span>
        </li>

        {/* Add-on products */}
        {products.map((product) => {
          const variant = getPrimaryVariant(product);
          const amount = Number(variant?.price.amount || 0);
          const checked = !!selected[product.handle];
          return (
            <li key={product.id} className="flex items-center gap-3 py-2.5">
              <button
                type="button"
                id={`bundle-cb-${product.handle}`}
                onClick={() =>
                  setSelected((prev) => ({
                    ...prev,
                    [product.handle]: !prev[product.handle],
                  }))
                }
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  checked
                    ? "border-clay bg-clay"
                    : "border-line"
                }`}
                aria-checked={checked}
                role="checkbox"
                aria-label={`Add ${product.title} to bundle`}
              >
                {checked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-cocoa">
                  {product.title}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-cocoa">
                {formatMoney(amount, currencyCode)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Footer: vet-price anchor + total + CTA */}
      <div className="border-t border-line bg-cream/60 px-4 py-4">
        {/* Phase 4 anchor — always frame against the $1,400+ vet bill, never
            against cheaper competitor devices (plan §"Anchoring rule"). */}
        <div className="mb-3 rounded-lg bg-honey-tint px-3 py-2 text-[13px] leading-snug text-brown">
          A single vet cleaning runs <b className="text-rose-soft">$500–$1,400+</b>{" "}
          with anesthesia and bloodwork. This bundle replaces it.
        </div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-brown">
            Bundle total ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span className="font-display text-lg font-bold text-cocoa">
            {formatMoney(total, currencyCode)}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="md"
            variant="primary"
            fullWidth
            onClick={onAddBundle}
            disabled={!canAdd}
            className="min-h-[52px] rounded-xl !bg-gold !text-cocoa hover:!bg-gold-deep hover:!text-white"
          >
            Add bundle to cart
          </Button>
          <Button
            type="button"
            size="md"
            variant="outline"
            onClick={onBuyNow}
            disabled={!canAdd || buyingNow}
            className="min-h-[52px] w-full rounded-xl !border-cocoa !border-[1.8px] !text-cocoa hover:!bg-cocoa hover:!text-white hover:!-translate-y-1 hover:!shadow-lg !bg-transparent"
          >
            {buyingNow ? "Redirecting…" : "Buy now"}
          </Button>
        </div>
        {addedCount > 0 && (
          <p className="mt-2 text-center text-xs font-semibold text-emerald-600">✓ Added {addedCount} items to your cart</p>
        )}
      </div>
    </div>
  );
}
