"use client";

import { useState } from "react";
import Image from "next/image";
import type { Image as ShopifyImage } from "@/types/shopify";

type Props = {
  productTitle: string;
  images: { node: ShopifyImage }[];
  fallbackUrl: string;
};

export function ProductGallery({ productTitle, images, fallbackUrl }: Props) {
  const list =
    images.length > 0
      ? images.map((e) => e.node)
      : [{ url: fallbackUrl, altText: productTitle, width: 1200, height: 1200 }];

  const [active, setActive] = useState(0);
  const main = list[active] ?? list[0];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--elev-shadow-card)]">
      <div className="relative aspect-square bg-gradient-to-b from-slate-100/80 to-transparent p-3 dark:from-slate-800/50 dark:to-transparent md:p-4">
        <div className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
          <Image
            src={main.url}
            alt={main.altText || productTitle}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 58vw"
            priority
          />
        </div>
      </div>

      {list.length > 1 && (
        <div className="border-t border-[var(--color-border)] bg-[var(--background)]/50 px-3 pb-3 pt-2 md:px-4 md:pb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Gallery ({list.length})
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {list.map((node, index) => {
              const isActive = index === active;
              return (
                <button
                  key={`${node.url}-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border-2 transition-all md:h-20 md:w-20 ${
                    isActive
                      ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25"
                      : "border-transparent opacity-85 hover:border-[var(--color-border)] hover:opacity-100"
                  }`}
                  aria-label={`View image ${index + 1} of ${list.length}`}
                  aria-pressed={isActive}
                >
                  <Image
                    src={node.url}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
