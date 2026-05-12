"use client";

import { useState } from "react";

import type { Product, ProductVariant } from "@/types/shopify";
import Button from "@/components/ui/Button";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

const TIERS = [
  { qty: 1, label: "Buy 1" },
  { qty: 2, label: "Buy 2", badge: "Free Shipping", popular: true },
  { qty: 3, label: "Buy 3", badge: "Best Value" },
] as const;

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(amount);
}

export default function VariantSelector({ product }: { product: Product }) {
  const variants = product.variants.edges.map((e) => e.node);
  const multi = variants.length > 1;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0]);
  const [tierIdx, setTierIdx] = useState(0);
  const [unitVariantIds, setUnitVariantIds] = useState<string[]>(
    Array(3).fill(variants[0]?.id ?? ""),
  );
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();


  const tier = TIERS[tierIdx];
  const currencyCode = selectedVariant?.price?.currencyCode || "USD";
  const unitPrice = parseFloat(selectedVariant?.price?.amount || "0");
  const totalPrice = unitPrice * tier.qty;

  function selectTier(idx: number) {
    setTierIdx(idx);
    setUnitVariantIds((prev) => {
      const next = [...prev];
      next[0] = selectedVariant?.id ?? "";
      return next;
    });
  }

  function selectTopVariant(variant: ProductVariant) {
    setSelectedVariant(variant);
    setUnitVariantIds((prev) => {
      const next = [...prev];
      next[0] = variant.id;
      return next;
    });
  }

  function setUnitVariant(unitIdx: number, variantId: string) {
    setUnitVariantIds((prev) => {
      const next = [...prev];
      next[unitIdx] = variantId;
      return next;
    });
  }


  function onAddToCart() {
    if (!selectedVariant?.availableForSale) return;

    const counts = new Map<string, number>();
    for (let i = 0; i < tier.qty; i++) {
      const vid = unitVariantIds[i] ?? selectedVariant.id;
      counts.set(vid, (counts.get(vid) ?? 0) + 1);
    }

    for (const [variantId, qty] of counts) {
      const v = variants.find((vv) => vv.id === variantId) ?? selectedVariant;
      addItem({
        merchandiseId: variantId,
        productHandle: product.handle,
        productTitle: product.title,
        variantTitle: v.title,
        imageUrl: product.images.edges[0]?.node?.url || "/product-placeholder.svg",
        currencyCode: v.price.currencyCode,
        unitPriceAmount: v.price.amount,
        quantity: qty,
      });
    }

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const isAvailable = selectedVariant?.availableForSale;

  return (
    <div className="flex flex-col gap-6">

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]/70">
          Your selection
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-4xl font-black tabular-nums tracking-tight text-[var(--color-primary)] md:text-5xl">
            {formatMoney(totalPrice, currencyCode)}
          </span>
          {tier.qty > 1 && (
            <span className="text-sm text-[var(--color-accent)]/70">
              {formatMoney(unitPrice, currencyCode)}/unit
            </span>
          )}

        </div>
      </div>

      {/* Variant buttons */}
      {multi && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-[var(--color-foreground)]">
            Choose an option
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = selectedVariant?.id === v.id;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectTopVariant(v)}
                  className={`min-h-[44px] rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/12 text-[var(--color-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20"
                      : "border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]/50"
                  }`}
                >
                  {v.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-accent)]/70">
            Bundle &amp; Save
          </span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <div className="space-y-3">
          {TIERS.map((t, i) => {
            const selected = tierIdx === i;
            const tTotal = unitPrice * t.qty;

            return (
              <div
                key={t.qty}
                onClick={() => selectTier(i)}
                className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                  selected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/8 shadow-sm"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
                }`}
              >
                {"popular" in t && (
                  <span className="absolute -top-3 right-4 rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected
                          ? "border-[var(--color-primary)]"
                          : "border-[var(--color-border)]"
                      }`}
                    >
                      {selected && (
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                      )}
                    </span>
                    <span className="font-bold text-[var(--color-foreground)]">
                      {t.label}
                    </span>
                    {"badge" in t && (
                      <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-base font-extrabold tabular-nums text-[var(--color-primary)]">
                    {formatMoney(tTotal, currencyCode)}
                  </span>
                </div>

                {selected && multi && t.qty > 1 && (
                  <div className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-3">
                    {Array.from({ length: t.qty }, (_, j) => {
                      const uid = unitVariantIds[j] ?? variants[0]?.id ?? "";
                      return (
                        <div key={j} className="flex items-center gap-2">
                          <span className="w-6 shrink-0 text-xs font-bold text-[var(--color-accent)]/70">
                            #{j + 1}
                          </span>
                          <select
                            value={uid}
                            onChange={(e) => setUnitVariant(j, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                          >
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>

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

        {/* Payment processor badges */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {/* Visa */}
          <div className="flex h-7 w-11 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
            <span className="text-[11px] font-black italic tracking-tight text-[#1434CB]">VISA</span>
          </div>
          {/* Mastercard */}
          <div className="relative flex h-7 w-11 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
            <span className="h-[18px] w-[18px] rounded-full bg-[#EB001B]" />
            <span className="-ml-2.5 h-[18px] w-[18px] rounded-full bg-[#F79E1B] opacity-90" />
          </div>
          {/* PayPal */}
          <div className="flex h-7 w-14 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
            <span className="text-[11px] font-black text-[#003087]">Pay</span>
            <span className="text-[11px] font-black text-[#009cde]">Pal</span>
          </div>
          {/* Apple Pay */}
          <div className="flex h-7 w-16 items-center justify-center rounded-md border border-slate-200 bg-black shadow-sm px-2">
            <span className="text-[11px] font-semibold tracking-tight text-white">Apple Pay</span>
          </div>
          {/* Google Pay */}
          <div className="flex h-7 w-16 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm px-2">
            <span className="text-[11px] font-bold text-[#5F6368]">G Pay</span>
          </div>
        </div>


        {added && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-emerald-600">
            <CheckCircle2 size={16} />
            Added to cart!{" "}
            <Link href="/checkout" className="underline underline-offset-2">
              View cart
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}