import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import type { BundleComponent } from "@/lib/shopify/bundle-contents";

// "What's included" list for a bundle PDP. Server component (no client state).
// Renders nothing when the product isn't a bundle / has no components, so the
// PDP can drop it in unconditionally. Styling matches the Warm Honey PDP cards.
export function BundleContents({ items }: { items: BundleComponent[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line bg-honey-tint/50 px-4 py-3">
        <Package className="h-4 w-4 text-gold-deep" aria-hidden />
        <p className="text-sm font-bold uppercase tracking-wider text-cocoa">
          What&apos;s included
        </p>
      </div>
      <ul className="divide-y divide-line/60 px-4">
        {items.map((it) => (
          <li key={it.handle} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
              <Image
                src={it.imageUrl || "/product-placeholder.svg"}
                alt={it.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${it.handle}`}
                className="truncate text-sm font-semibold text-cocoa hover:underline"
              >
                {it.title}
              </Link>
            </div>
            <span className="shrink-0 text-xs font-bold text-brown">×{it.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
