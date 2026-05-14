"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";

function formatMoney(amount: string | number, currency: string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(n);
}

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotalAmount,
    subtotalCurrency,
    hydrated,
    drawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    checkoutUrl,
    isCartLoading,
  } = useCart();

  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  function handleCheckout() {
    window.location.href = checkoutUrl || "/checkout";
  }

  return (
    <>
      <div
        aria-hidden
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-[var(--color-surface)] shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-[var(--color-primary)]" />
            <h2 className="text-lg font-extrabold text-[var(--color-foreground)]">
              Your cart
              {hydrated && itemCount > 0 && (
                <span className="ml-2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">
                  {itemCount}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)]"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!hydrated ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="flex animate-pulse gap-4 rounded-2xl border border-[var(--color-border)] p-3"
                >
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 rounded bg-slate-200" />
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                <ShoppingBag size={28} className="text-[var(--color-primary)]" />
              </div>
              <p className="text-lg font-bold text-[var(--color-foreground)]">Your cart is empty</p>
              <p className="mt-2 text-sm text-slate-500">Add something for your furry friend!</p>
              <Link
                href="/collections/all"
                onClick={closeDrawer}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Shop now <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const lineTotal = parseFloat(item.unitPriceAmount || "0") * item.quantity;
                return (
                  <li
                    key={item.merchandiseId}
                    className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--background)] p-3 transition-shadow hover:shadow-sm"
                  >
                    <Link
                      href={`/products/${item.productHandle}`}
                      onClick={closeDrawer}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)]"
                      tabIndex={-1}
                    >
                      <Image
                        src={item.imageUrl || "/product-placeholder.svg"}
                        alt={item.productTitle}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productHandle}`}
                            onClick={closeDrawer}
                            className="block truncate text-sm font-bold text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
                          >
                            {item.productTitle}
                          </Link>
                          {item.variantTitle && item.variantTitle !== "Default Title" && (
                            <p className="mt-0.5 text-xs text-slate-500">{item.variantTitle}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.merchandiseId)}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          aria-label={`Remove ${item.productTitle}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-xl border border-[var(--color-border)] text-sm">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.merchandiseId, item.quantity - 1)}
                            className="px-2.5 py-1.5 transition-colors hover:bg-[var(--color-surface-2)]"
                            aria-label="Decrease"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-[1.75rem] text-center font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.merchandiseId, item.quantity + 1)}
                            className="px-2.5 py-1.5 transition-colors hover:bg-[var(--color-surface-2)]"
                            aria-label="Increase"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="text-sm font-extrabold text-[var(--color-foreground)]">
                          {formatMoney(lineTotal, item.currencyCode)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {hydrated && items.length > 0 && (
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">
                Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
              </span>
              <span className="text-xl font-black text-[var(--color-foreground)]">
                {formatMoney(subtotalAmount, subtotalCurrency)}
              </span>
            </div>
            <p className="mb-4 text-center text-xs text-slate-500">
              Shipping &amp; taxes calculated at checkout
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isCartLoading}
              isLoading={isCartLoading}
              leftIcon={isCartLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              className="min-h-[52px] rounded-2xl"
              onClick={handleCheckout}
            >
              {isCartLoading ? "Syncing cart…" : "Checkout securely"}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
