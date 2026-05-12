"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ShoppingBag, CheckCircle2 } from "lucide-react";
import type { Product } from "@/types/shopify";
import Button from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

function formatMoney(amount: string, currencyCode: string) {
  const n = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(n);
}

export default function QuickAddModal({ product, open, onClose }: Props) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.edges[0]?.node,
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!open) return null;

  const multi = product.variants.edges.length > 1;
  const isAvailable = selectedVariant?.availableForSale;
  const formattedPrice = selectedVariant?.price
    ? formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)
    : "";

  function onAdd() {
    if (!selectedVariant || !isAvailable) return;
    addItem({
      merchandiseId: selectedVariant.id,
      productHandle: product.handle,
      productTitle: product.title,
      variantTitle: selectedVariant.title,
      imageUrl:
        product.images.edges[0]?.node?.url || "/product-placeholder.svg",
      currencyCode: selectedVariant.price.currencyCode,
      unitPriceAmount: selectedVariant.price.amount,
      quantity,
    });
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label={`Quick add ${product.title}`}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-3xl bg-[var(--color-surface)] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)] transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Product preview */}
        <div className="flex gap-4 mb-6 pr-8">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[var(--background)]">
            <Image
              src={
                product.images.edges[0]?.node?.url || "/product-placeholder.svg"
              }
              alt={product.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <p className="font-bold text-[var(--color-foreground)] leading-snug line-clamp-2">
              {product.title}
            </p>
            <p className="mt-1 text-lg font-black text-[var(--color-primary)]">
              {formattedPrice}
            </p>
          </div>
        </div>

        {/* Variant selector */}
        {multi && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Option
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.edges.map(({ node }) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedVariant(node)}
                  className={`min-h-[40px] rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                    selectedVariant?.id === node.id
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/12 text-[var(--color-primary)] shadow-sm"
                      : "border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]/50"
                  }`}
                >
                  {node.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mb-5 flex items-center justify-between rounded-xl border border-[var(--color-border)]/70 px-3 py-2">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Quantity
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-full border border-[var(--color-border)] text-sm font-bold hover:bg-[var(--color-surface-2)] transition-colors"
              aria-label="Decrease"
            >
              -
            </button>
            <span className="w-6 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="h-8 w-8 rounded-full border border-[var(--color-border)] text-sm font-bold hover:bg-[var(--color-surface-2)] transition-colors"
              aria-label="Increase"
            >
              +
            </button>
          </div>
        </div>

        {/* CTA */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isAvailable || added}
          leftIcon={
            added ? <CheckCircle2 size={20} /> : <ShoppingBag size={20} />
          }
          className="min-h-[50px] rounded-2xl"
          onClick={onAdd}
        >
          {added
            ? "Added to cart!"
            : isAvailable
              ? `Add ${quantity} to cart`
              : "Out of stock"}
        </Button>
      </div>
    </>
  );
}
