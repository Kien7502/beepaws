"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart, cartLineKey } from "@/components/cart/CartProvider";

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

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Reset stuck spinner after bfcache restore. handleCheckout sets
  // checkoutLoading=true then navigates away to Shopify; the navigation tears
  // down the promise chain before setCheckoutLoading(false) ever runs. When the
  // user presses Back, bfcache restores React state exactly as-is — including
  // the orphaned true flag. pageshow.persisted is the canonical signal for
  // "we just came back from bfcache"; clear the flag so the button is usable.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        setCheckoutLoading(false);
        setCheckoutError(null);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Always go to the Storefront cart's checkoutUrl when available. If it
  // isn't synced yet (or sync failed), fall back to the API endpoint which
  // creates a fresh Shopify cart from our local items. No in-app cart page.
  async function handleCheckout() {
    if (items.length === 0 || checkoutLoading) return;
    setCheckoutError(null);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/shopify/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((item) => ({
            merchandiseId: item.merchandiseId,
            quantity: item.quantity,
          })),
        }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Couldn't open checkout");
      }
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setCheckoutLoading(false);
      setCheckoutError(e instanceof Error ? e.message : "Checkout failed");
    }
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
                const baseTotal = parseFloat(item.unitPriceAmount || "0") * item.quantity;
                // Synced carts carry Shopify's post-discount line cost (kit
                // discounts + tier gifts apply IN the cart, not just at
                // checkout — verified live 2026-07-19). Prefer it; fall back
                // to unitPrice×qty for optimistic/local lines.
                const discountedTotal =
                  item.lineTotalAmount != null && item.lineTotalAmount !== ""
                    ? parseFloat(item.lineTotalAmount)
                    : null;
                const lineTotal = discountedTotal ?? baseTotal;
                const lineDiscounted =
                  discountedTotal !== null && discountedTotal < baseTotal - 0.001;
                const lineFree = lineTotal <= 0.001 && item.quantity > 0;
                // Bundle lines don't link anywhere: bundles are offers, not
                // destinations — their PDPs 404 by design (route guard), so a
                // link here would dead-end mid-purchase.
                const isBundleLine = (item.bundleComponents?.length ?? 0) > 0;
                const thumb = (
                  <Image
                    src={item.imageUrl || "/product-placeholder.svg"}
                    alt={item.productTitle}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                );
                return (
                  <li
                    // cartLineKey, not merchandiseId: the same variant can sit
                    // in the cart twice — once one-time, once subscribed.
                    key={cartLineKey(item)}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--background)] p-3 transition-shadow hover:shadow-sm"
                  >
                    {isBundleLine ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)]">
                        {thumb}
                      </div>
                    ) : (
                      <Link
                        href={`/products/${item.productHandle}`}
                        onClick={closeDrawer}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)]"
                        tabIndex={-1}
                      >
                        {thumb}
                      </Link>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {isBundleLine ? (
                            <p className="truncate text-sm font-bold text-[var(--color-foreground)]">
                              {item.productTitle}
                            </p>
                          ) : (
                            <Link
                              href={`/products/${item.productHandle}`}
                              onClick={closeDrawer}
                              className="block truncate text-sm font-bold text-[var(--color-foreground)] hover:text-[var(--color-primary)]"
                            >
                              {item.productTitle}
                            </Link>
                          )}
                          {/* For a bundle, the variant value is shown under its
                              own component below — not here on the bundle line. */}
                          {!item.bundleComponents?.length &&
                            item.variantTitle &&
                            item.variantTitle !== "Default Title" && (
                              <p className="mt-0.5 text-xs text-slate-500">{item.variantTitle}</p>
                            )}
                          {/* Subscribe & Save line — the plan name carries
                              cadence + discount ("Deliver every 2 weeks, 15% off"). */}
                          {item.sellingPlanName && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-hover)]">
                              <RefreshCcw size={11} aria-hidden />
                              {item.sellingPlanName}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(cartLineKey(item))}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          aria-label={`Remove ${item.productTitle}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Bundle components — list what a bundle line expands
                          into (Shopify expands them at checkout; we show them
                          here for parity with the product page). */}
                      {item.bundleComponents && item.bundleComponents.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {item.bundleComponents.map((c, ci) => (
                            <li
                              key={ci}
                              className="flex items-center gap-1.5 text-[11px] text-slate-500"
                            >
                              <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                                <Image
                                  src={c.imageUrl || "/product-placeholder.svg"}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="20px"
                                />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate">
                                  <span className="font-semibold">{c.quantity}×</span> {c.title}
                                </span>
                                {c.options && c.options.length > 0 && (
                                  <span className="block truncate text-[10.5px] text-slate-400">
                                    {c.options.join(", ")}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-xl border border-[var(--color-border)] text-sm">
                          <button
                            type="button"
                            onClick={() => updateQuantity(cartLineKey(item), item.quantity - 1)}
                            className="px-2.5 py-1.5 transition-colors hover:bg-[var(--color-surface-2)]"
                            aria-label="Decrease"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-[1.75rem] text-center font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)}
                            className="px-2.5 py-1.5 transition-colors hover:bg-[var(--color-surface-2)]"
                            aria-label="Increase"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="text-sm font-extrabold text-[var(--color-foreground)]">
                          {lineFree ? (
                            <>
                              {baseTotal > 0 && (
                                <span className="mr-1.5 text-xs font-semibold text-slate-400 line-through">
                                  {formatMoney(baseTotal, item.currencyCode)}
                                </span>
                              )}
                              <span className="text-positive">FREE</span>
                            </>
                          ) : (
                            <>
                              {lineDiscounted && (
                                <span className="mr-1.5 text-xs font-semibold text-slate-400 line-through">
                                  {formatMoney(baseTotal, item.currencyCode)}
                                </span>
                              )}
                              {formatMoney(lineTotal, item.currencyCode)}
                            </>
                          )}
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
              disabled={isCartLoading || checkoutLoading}
              isLoading={isCartLoading || checkoutLoading}
              leftIcon={
                isCartLoading || checkoutLoading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <ArrowRight size={18} />
              }
              className="min-h-[52px] rounded-2xl"
              onClick={handleCheckout}
            >
              {isCartLoading
                ? "Syncing cart…"
                : checkoutLoading
                  ? "Opening checkout…"
                  : "Checkout securely"}
            </Button>
            {checkoutError && (
              <p className="mt-2 text-center text-xs text-rose-600">{checkoutError}</p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
