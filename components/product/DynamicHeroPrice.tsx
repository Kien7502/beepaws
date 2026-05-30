"use client";

import { useProductMedia } from "./ProductMediaSync";

// Hero price block that lives inside ProductMediaSync so it can re-render
// when the user picks a different variant in VariantSelector. Initial values
// come from the server-rendered minVariantPrice (so the first paint matches
// what was previously hardcoded). Once a variant is selected, activeVariant
// wins. Strikethrough + savings % stay anchored to the product-level
// compareAtPrice minimum because variants don't carry their own compareAt in
// our shopify type — if that ever lands, plumb it through here too.

interface Props {
  /** Server-side initial price (product.priceRange.minVariantPrice). Shown
   *  on first paint before the client picks a variant. */
  fallbackAmount: string;
  /** Currency code for both price and strikethrough — assumed constant
   *  across variants. */
  currencyCode: string;
  /** Strikethrough source (product.compareAtPriceRange?.minVariantPrice.amount).
   *  null/undefined hides the strikethrough + Save badge. */
  compareAtAmount?: string | null;
  /** Server-side availability — used until the client publishes a variant. */
  fallbackAvailable: boolean;
}

export function DynamicHeroPrice({
  fallbackAmount,
  currencyCode,
  compareAtAmount,
  fallbackAvailable,
}: Props) {
  const { activeVariant } = useProductMedia();
  const amount = activeVariant?.amount ?? fallbackAmount;
  const currency = activeVariant?.currencyCode ?? currencyCode;
  const available = activeVariant?.availableForSale ?? fallbackAvailable;

  const compareAtNum = compareAtAmount ? parseFloat(compareAtAmount) : 0;
  const amountNum = parseFloat(amount);
  const showStrike = compareAtAmount != null && compareAtNum > amountNum;
  const savings = showStrike ? Math.round(((compareAtNum - amountNum) / compareAtNum) * 100) : 0;

  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency });

  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-3">
      <span className="font-display text-[33px] font-bold text-ink">
        {formatter.format(amountNum)}
      </span>
      {showStrike && (
        <>
          <span className="text-lg text-brown/60 line-through">
            {formatter.format(compareAtNum)}
          </span>
          <span className="rounded-md bg-gold px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-cocoa">
            Save {savings}%
          </span>
        </>
      )}
      {!available && (
        <span className="rounded-full bg-cocoa/10 px-2.5 py-0.5 text-xs font-bold text-cocoa">
          Out of stock
        </span>
      )}
    </div>
  );
}
