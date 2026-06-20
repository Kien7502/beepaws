import Image from "next/image";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import type { Product } from "@/types/shopify";

// Bundle-offer card shown in the buy column IN PLACE OF the price row when a
// product has a `beepaws.related_bundle` metafield pointing at a real Shopify
// bundle. Steers the shopper to the bundle's PDP. See docs/bundles-from-admin.md.
function money(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(parseFloat(amount));
}

export function BundleOffer({ bundle }: { bundle: Product }) {
  const price = bundle.priceRange.minVariantPrice;
  const compareAt = bundle.compareAtPriceRange?.minVariantPrice ?? null;
  const saving =
    compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount)
      ? parseFloat(compareAt.amount) - parseFloat(price.amount)
      : 0;
  const imageUrl = bundle.images?.edges?.[0]?.node?.url || "/product-placeholder.svg";

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border-2 border-gold bg-cream">
      <div className="flex items-center gap-1.5 bg-honey-tint px-4 py-2">
        <Package className="h-4 w-4 text-gold-deep" aria-hidden />
        <span className="text-[12px] font-bold uppercase tracking-[0.07em] text-clay">
          Better together — bundle &amp; save
        </span>
      </div>

      <div className="flex items-center gap-4 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-card">
          <Image src={imageUrl} alt={bundle.title} fill className="object-cover" sizes="80px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold leading-tight text-cocoa">{bundle.title}</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <span className="font-display text-xl font-bold text-cocoa">
              {money(price.amount, price.currencyCode)}
            </span>
            {saving > 0 && compareAt && (
              <>
                <span className="text-sm text-brown/60 line-through">
                  {money(compareAt.amount, compareAt.currencyCode)}
                </span>
                <span className="rounded-full bg-clay px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-white">
                  Save {money(String(saving), price.currencyCode)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <Link
        href={`/products/${bundle.handle}`}
        className="flex items-center justify-center gap-2 bg-clay px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-cocoa active:scale-[0.99]"
      >
        Shop the bundle <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
  );
}
