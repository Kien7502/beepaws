"use client";

import { useState } from "react";
import type { Product } from "@/types/shopify";
import Button from "@/components/ui/Button";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

function formatMoney(amount: string, currencyCode: string) {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(n);
}

export default function VariantSelector({
  product,
  showPriceRangeHint = false,
}: {
  product: Product;
  showPriceRangeHint?: boolean;
}) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.edges[0]?.node,
  );
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const isAvailable = selectedVariant?.availableForSale;

  const price = selectedVariant?.price
    ? parseFloat(selectedVariant.price.amount)
    : 0;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: selectedVariant?.price?.currencyCode || "USD",
  }).format(price);

  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const rangeCaption =
    showPriceRangeHint &&
    minVariantPrice.amount !== maxVariantPrice.amount
      ? `${formatMoney(minVariantPrice.amount, minVariantPrice.currencyCode)} – ${formatMoney(maxVariantPrice.amount, maxVariantPrice.currencyCode)}`
      : null;

  const multi = product.variants.edges.length > 1;

  function onAddToCart() {
    if (!selectedVariant || !isAvailable) return;

    addItem({
      merchandiseId: selectedVariant.id,
      productHandle: product.handle,
      productTitle: product.title,
      variantTitle: selectedVariant.title,
      imageUrl: product.images.edges[0]?.node?.url || "/product-placeholder.svg",
      currencyCode: selectedVariant.price.currencyCode,
      unitPriceAmount: selectedVariant.price.amount,
      quantity: 1,
    });
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Your selection
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl font-black tabular-nums tracking-tight text-[var(--color-primary)] md:text-5xl">
            {formattedPrice}
          </span>
          {multi && selectedVariant?.title && selectedVariant.title !== "Default Title" && (
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              · {selectedVariant.title}
            </span>
          )}
        </div>
        {rangeCaption && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            All options: {rangeCaption}
          </p>
        )}
      </div>

      {multi && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-[var(--color-foreground)]">
            Choose an option
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.edges.map(({ node }) => {
              const active = selectedVariant?.id === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedVariant(node)}
                  className={`min-h-[44px] rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/12 text-[var(--color-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20"
                      : "border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]/50"
                  }`}
                >
                  {node.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-border)] pt-6">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isAvailable}
          leftIcon={<ShoppingBag size={22} />}
          className="min-h-[52px] rounded-2xl text-base md:text-lg"
          onClick={onAddToCart}
        >
          {isAvailable ? "Add to cart" : "Out of stock"}
        </Button>
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Added items stay in your Beepaws cart until you checkout.
        </p>
        {added && (
          <p className="mt-2 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Added to cart.{" "}
            <Link href="/checkout" className="underline underline-offset-2">
              View cart
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
