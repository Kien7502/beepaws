"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { useState } from "react";

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(amount);
}

export default function CheckoutClient() {
  const {
    items,
    hydrated,
    subtotalAmount,
    subtotalCurrency,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkoutWithShopify() {
    if (items.length === 0 || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      let checkoutUrl = "";
      for (const item of items) {
        const res = await fetch("/api/shopify/cart/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchandiseId: item.merchandiseId,
            quantity: item.quantity,
          }),
        });
        const data = (await res.json()) as { checkoutUrl?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Failed to sync cart with Shopify");
        }
        if (data.checkoutUrl) checkoutUrl = data.checkoutUrl;
      }

      if (!checkoutUrl) throw new Error("Shopify checkout URL not available");
      clearCart();
      window.location.href = checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setIsSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <div className="mb-4 h-7 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center md:px-6 md:py-24">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)]">
            <ShoppingBag size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-foreground)]">
            Your cart is empty
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Add products from the catalog, then checkout from here.
          </p>
          <Link
            href="/collections/all"
            className="mt-7 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 font-bold text-white hover:opacity-95"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-foreground)] md:text-4xl">
        Your cart
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Review items here, then we transfer your cart to Shopify for secure payment.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {items.map((item) => (
            <div
              key={item.merchandiseId}
              className="grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-[112px_1fr]"
            >
              <div className="relative h-[88px] w-[88px] overflow-hidden rounded-xl border border-[var(--color-border)] md:h-[112px] md:w-[112px]">
                <Image
                  src={item.imageUrl || "/product-placeholder.svg"}
                  alt={item.productTitle}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/products/${item.productHandle}`}
                      className="font-bold text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
                    >
                      {item.productTitle}
                    </Link>
                    {item.variantTitle && item.variantTitle !== "Default Title" && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {item.variantTitle}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.merchandiseId)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-xl border border-[var(--color-border)]">
                    <button
                      type="button"
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() =>
                        updateQuantity(item.merchandiseId, Math.max(0, item.quantity - 1))
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="min-w-10 px-2 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() =>
                        updateQuantity(item.merchandiseId, Math.min(99, item.quantity + 1))
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="text-base font-extrabold text-[var(--color-foreground)]">
                    {formatMoney(
                      parseFloat(item.unitPriceAmount || "0") * item.quantity,
                      item.currencyCode,
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-xl font-extrabold text-[var(--color-foreground)]">
            Order summary
          </h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
              <span className="font-bold">
                {formatMoney(subtotalAmount, subtotalCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Shipping</span>
              <span className="font-bold">Calculated at checkout</span>
            </div>
          </div>
          <div className="mt-5 border-t border-[var(--color-border)] pt-5">
            <div className="flex justify-between">
              <span className="font-semibold">Estimated total</span>
              <span className="text-lg font-black">
                {formatMoney(subtotalAmount, subtotalCurrency)}
              </span>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            className="mt-6 min-h-[52px] rounded-2xl"
            isLoading={isSubmitting}
            onClick={checkoutWithShopify}
          >
            Proceed to payment
          </Button>
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            You will be redirected to Shopify for secure checkout.
          </p>
        </aside>
      </div>
    </div>
  );
}
