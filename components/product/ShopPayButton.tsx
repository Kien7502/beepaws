"use client";

import { useState } from "react";
import Image from "next/image";

// "Buy with Shop Pay" — Shopify's accelerated-checkout button. POSTs the
// current selection directly to /api/shopify/cart/checkout, which returns a
// real Shopify checkout URL we can navigate to. Skips the in-app cart entirely.
//
// SVG asset: drop the official Shop Pay button artwork at
//   public/payment/shop-pay.svg
// (e.g. from Shopify Brand Center). The SVG should include the full pill —
// purple background, white "Buy with shop · Pay" wordmark.

export type CartLine = {
  merchandiseId: string;
  quantity: number;
};

type Props = {
  /** Returns the variant lines to put in the Shopify cart on click. Called
   * just-in-time so it reflects the user's current bundle/variant picks. */
  buildLines: () => CartLine[];
  /** Visually disable + block click — e.g., when out of stock. */
  disabled?: boolean;
};

export function ShopPayButton({ buildLines, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (disabled || loading) return;
    setError(null);
    setLoading(true);

    try {
      const lines = buildLines();
      if (lines.length === 0) throw new Error("Nothing to buy");
      const res = await fetch("/api/shopify/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Couldn't open checkout");
      }
      // Append `?payment=shop_pay` so Shopify's checkout opens Shop Pay's
      // express flow directly (logged-in users land straight in Shop Pay
      // checkout; new users see the Shop Pay login prompt). Without this,
      // the user lands on the normal checkout with Shop Pay as one option.
      const url = new URL(data.checkoutUrl);
      url.searchParams.set("payment", "shop_pay");
      window.location.href = url.toString();
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Checkout failed");
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="relative block w-full overflow-hidden rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110 active:translate-y-0 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:brightness-100 disabled:hover:shadow-sm"
        aria-label="Buy with Shop Pay"
      >
        <Image
          src="/payment/shop-pay.svg"
          alt="Buy with Shop Pay"
          width={400}
          height={48}
          className="h-12 w-full object-contain"
          priority={false}
        />
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
