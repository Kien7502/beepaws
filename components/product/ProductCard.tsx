import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import type { Product } from "@/types/shopify";
import Button from "../ui/Button";

interface ProductCardProps {
  handle: string;
  title: string;
  /** Pre-formatted display price (e.g. "$54.99"). Computed by the caller because
   * currency formatting depends on locale that the card itself doesn't know. */
  price: string;
  /** Optional pre-formatted strike-through price. If omitted but `product` is
   * present, the card derives it from product.compareAtPriceRange. */
  compareAtPrice?: string;
  imageUrl: string;
  /** Full Product when available — enables rating row, savings calc, stock pill,
   * and the Quick-add affordance. Falls back to a "Shop Now" link without it. */
  product?: Product;
}

function formatMoney(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

const ProductCard: React.FC<ProductCardProps> = ({
  handle,
  title,
  price,
  compareAtPrice: compareAtPriceProp,
  imageUrl,
  product,
}) => {
  // Derive sale info from product when caller didn't pass an explicit compare price.
  // We prefer numeric comparison (priceRange vs compareAtPriceRange) over the
  // formatted string so we can compute the savings amount + % off ourselves.
  let priceNum = 0;
  let comparePriceNum = 0;
  let comparePriceDisplay: string | null = compareAtPriceProp ?? null;

  if (product?.compareAtPriceRange?.minVariantPrice?.amount) {
    const min = product.priceRange.minVariantPrice;
    const cmp = product.compareAtPriceRange.minVariantPrice;
    priceNum = parseFloat(min.amount);
    comparePriceNum = parseFloat(cmp.amount);
    if (comparePriceNum > priceNum) {
      comparePriceDisplay = comparePriceDisplay ?? formatMoney(cmp.amount, cmp.currencyCode);
    } else {
      comparePriceDisplay = null;
    }
  }

  const savingsAmount = comparePriceNum > priceNum ? comparePriceNum - priceNum : 0;
  const savingsPct = comparePriceNum > 0 && priceNum > 0
    ? Math.round(((comparePriceNum - priceNum) / comparePriceNum) * 100)
    : 0;

  const rating = product?.rating ?? null;
  const soldOut = product ? !product.availableForSale : false;
  // Driven by the Shopify "best-seller" tag — visible across every grid
  // (homepage, /collections/all, /collections/[handle]) without needing a
  // separate Best Sellers section, which would be redundant at small catalog size.
  const isBestSeller = product?.tags?.includes("best-seller") ?? false;

  // `h-full` makes the card fill the grid row; the inner content uses `flex-1`
  // + `mt-auto` on the CTA so the button aligns to the bottom across all cards
  // regardless of tagline length.
  const filledStars = rating ? Math.round(rating.avg) : 0;

  return (
    <div className="group relative flex h-full flex-col">
      {/* Dashed accent border picks up the brand-brown tone — single-color across
          all cards so the brand stays consistent regardless of product category. */}
      <Link
        href={`/products/${handle}`}
        className="relative mb-3 block aspect-square overflow-hidden rounded-2xl bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-accent)]/35 transition-shadow duration-300 hover:shadow-[var(--elev-shadow-card-hover)] hover:border-[var(--color-accent)]/60"
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Top-left: savings badge — shows dollar amount + % off when both exist,
            else falls back to a plain SALE pill. Skipped when not on sale. */}
        {savingsAmount > 0 ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">
            Save ${savingsAmount.toFixed(0)} · {savingsPct}% off
          </div>
        ) : comparePriceDisplay ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">
            Sale
          </div>
        ) : null}

        {/* Bottom-left: sold-out pill. Only renders when we know the stock state
            (i.e. `product` was passed). */}
        {soldOut && (
          <div className="absolute bottom-3 left-3 z-10 rounded-full bg-[var(--color-foreground)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            Sold out
          </div>
        )}

        {/* Top-right: Best Seller badge. Positioned away from Save (top-left)
            and Sold-out (bottom-left) so all three can coexist on a single card. */}
        {isBestSeller && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">
            <Star className="h-3 w-3 fill-white text-white" aria-hidden />
            Bestseller
          </div>
        )}

      </Link>

      {/* Below-image content block — left-aligned, info-dense */}
      <div className="flex flex-1 flex-col gap-1.5 px-1">
        {rating && (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[var(--color-accent)]/70">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < filledStars
                      ? "h-3.5 w-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]"
                      : "h-3.5 w-3.5 fill-none text-[var(--color-primary)]/30"
                  }
                  aria-hidden
                />
              ))}
            </div>
            <span className="font-bold text-[var(--color-foreground)]">{rating.avg.toFixed(1)}/5</span>
            <span aria-hidden>·</span>
            <span>
              Loved by {rating.count.toLocaleString()} pet parent{rating.count === 1 ? "" : "s"}
            </span>
          </div>
        )}

        <Link href={`/products/${handle}`} className="outline-none">
          <h3 className="line-clamp-2 text-base font-extrabold text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-primary)] md:text-lg">
            {title}
          </h3>
        </Link>

        {product?.tagline && (
          <p className="line-clamp-2 text-xs leading-snug text-[var(--color-accent)]/70 md:text-sm">
            {product.tagline}
          </p>
        )}

        <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-extrabold text-[var(--color-foreground)] md:text-lg">{price}</span>
          {comparePriceDisplay && (
            <span className="text-sm font-semibold text-[var(--color-accent)]/40 line-through">
              {comparePriceDisplay}
            </span>
          )}
        </div>

        {/* Single CTA — always sends to the PDP. Considered-purchase products
            sell better when the customer reads comparison/reviews/before-after
            before being asked to commit. `mt-auto` pins the button to the bottom
            so cards stay visually aligned regardless of tagline length. */}
        <Link href={`/products/${handle}`} className="mt-auto pt-3">
          <Button
            variant={soldOut ? "outline" : "primary"}
            fullWidth
            rightIcon={soldOut ? undefined : <ArrowRight size={16} />}
            className="min-h-[40px]"
          >
            {soldOut ? "View details" : "See more"}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
