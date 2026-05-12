"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Product, ProductVariant } from "@/types/shopify";
import Button from "@/components/ui/Button";
import { CheckCircle2, ShoppingBag } from "lucide-react";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  // Read initial variant from ?variant=<id> URL param
  const variantNodes = product.variants.edges.map((e) => e.node);
  const urlVariantId = searchParams.get("variant");
  const initialVariant =
    (urlVariantId
      ? variantNodes.find((v) => v.id === urlVariantId || v.id.endsWith(`/${urlVariantId}`))
      : undefined) ?? variantNodes[0];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    initialVariant,
  );
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Sync selected variant → URL without full navigation
  useEffect(() => {
    if (!selectedVariant) return;
    const params = new URLSearchParams(searchParams.toString());
    // Use the numeric GID tail so the URL stays readable (e.g. ?variant=12345)
    const idTail = selectedVariant.id.split("/").pop() ?? selectedVariant.id;
    params.set("variant", idTail);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.id]);

  const isAvailable = selectedVariant?.availableForSale;

  const formattedPrice = selectedVariant?.price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: selectedVariant.price.currencyCode || "USD",
      }).format(parseFloat(selectedVariant.price.amount))
    : "";

  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const rangeCaption =
    showPriceRangeHint && minVariantPrice.amount !== maxVariantPrice.amount
      ? `${formatMoney(minVariantPrice.amount, minVariantPrice.currencyCode)} – ${formatMoney(maxVariantPrice.amount, maxVariantPrice.currencyCode)}`
      : null;

  const multi = variantNodes.length > 1;

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
      quantity,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Price display */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Your selection
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl font-black tabular-nums tracking-tight text-[var(--color-primary)] md:text-5xl">
            {formattedPrice}
          </span>
          {multi &&
            selectedVariant?.title &&
            selectedVariant.title !== "Default Title" && (
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

      {/* Variant buttons */}
      {multi && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-[var(--color-foreground)]">
            Choose an option
          </p>
          <div className="flex flex-wrap gap-2">
            {variantNodes.map((node) => {
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

      {/* Quantity + Add to cart */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)]/70 px-3 py-2">
          <span className="text-sm font-semibold text-[var(--color-foreground)]">
            Quantity
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="min-h-[36px] min-w-[36px] rounded-full border border-[var(--color-border)] text-base font-bold hover:bg-[var(--color-surface-2)] transition-colors"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="min-w-7 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="min-h-[36px] min-w-[36px] rounded-full border border-[var(--color-border)] text-base font-bold hover:bg-[var(--color-surface-2)] transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

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
          {isAvailable ? `Add ${quantity} to cart` : "Out of stock"}
        </Button>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Added items stay in your Beepaws cart until you checkout.
        </p>

        {added && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} />
            Added {quantity} to cart.{" "}
            <Link href="/checkout" className="underline underline-offset-2">
              View cart
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
