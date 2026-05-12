"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

export function CartDrawer() {
  const { items, itemCount, subtotalAmount, subtotalCurrency, hydrated, isCartOpen, closeCart, updateQuantity, removeItem } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isCartOpen, closeCart]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isCartOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: isCartOpen ? 1 : 0, pointerEvents: isCartOpen ? "auto" : "none" }}
        aria-hidden
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-[var(--background)] shadow-2xl transition-transform duration-300 ease-in-out"
        style={{ transform: isCartOpen ? "translateX(0)" : "translateX(100%)" }}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[var(--color-primary)]" />
            <span className="font-black text-lg text-[var(--color-foreground)]">Your Cart</span>
            {hydrated && itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-extrabold text-[#3d2400]">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-accent)] hover:bg-[var(--color-secondary)] transition-colors"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!hydrated || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <ShoppingBag size={48} className="text-[var(--color-border)]" />
              <p className="font-bold text-[var(--color-foreground)]">Your cart is empty</p>
              <p className="text-sm text-[var(--color-accent)]/60">Add something for your furry friend!</p>
              <button
                onClick={closeCart}
                className="mt-2 rounded-full bg-[var(--color-primary)] px-6 py-2 text-sm font-extrabold text-[#3d2400] hover:brightness-105 transition-all"
              >
                Keep shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.merchandiseId} className="flex gap-3">
                  {/* Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productTitle}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🐾</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--color-foreground)] leading-snug line-clamp-2">
                      {item.productTitle}
                    </p>
                    {item.variantTitle && item.variantTitle !== "Default Title" && (
                      <p className="text-xs text-[var(--color-accent)]/60">{item.variantTitle}</p>
                    )}
                    <p className="text-sm font-extrabold text-[var(--color-primary)] mt-auto">
                      {formatMoney(parseFloat(item.unitPriceAmount) * item.quantity, item.currencyCode)}
                    </p>
                  </div>

                  {/* Qty + Remove */}
                  <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                    <button
                      onClick={() => removeItem(item.merchandiseId)}
                      className="text-[var(--color-accent)]/40 hover:text-red-400 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] px-1 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.merchandiseId, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-accent)] hover:bg-[var(--color-secondary)] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-[var(--color-foreground)]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.merchandiseId, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-accent)] hover:bg-[var(--color-secondary)] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {hydrated && items.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-5 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-accent)]/70">Subtotal</span>
              <span className="font-extrabold text-[var(--color-foreground)]">
                {formatMoney(subtotalAmount, subtotalCurrency)}
              </span>
            </div>
            <p className="text-xs text-[var(--color-accent)]/50 text-center">
              Shipping &amp; taxes calculated at checkout
            </p>
            <a
              href="/checkout"
              className="block w-full rounded-full bg-[var(--color-accent)] py-3.5 text-center text-sm font-extrabold text-white hover:brightness-110 transition-all"
            >
              Checkout
            </a>
            <button
              onClick={closeCart}
              className="block w-full rounded-full bg-[#3d2400] py-3 text-center text-sm font-bold text-white hover:bg-[#5a3800] transition-colors"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
