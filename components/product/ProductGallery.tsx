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
    <div className="card-elevated p-4 md:sticky md:top-28">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--background)]">
        <Image
          src={main.url}
          alt={main.altText || productTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {list.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {list.map((node, index) => (
            <button
              key={node.url}
              type="button"
              onClick={() => setActive(index)}
              className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all snap-start ${
                index === active
                  ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25 scale-[1.02]"
                  : "border-transparent opacity-80 hover:opacity-100 hover:border-[var(--color-border)]"
              }`}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === active}
            >
              <Image
                src={node.url}
                alt=""
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
