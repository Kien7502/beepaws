"use client";

import { useState, useRef, useEffect } from "react";
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
  const hasMultiple = list.length > 1;
  const thumbListRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = thumbListRef.current;
    if (!el) return;
    const block = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", block, { passive: false });
    return () => el.removeEventListener("wheel", block);
  }, []);

  function selectImage(index: number) {
    setActive(index);
    const el = thumbListRef.current;
    const thumb = thumbRefs.current[index];
    if (!el || !thumb) return;

    const h = thumb.offsetHeight;
    const top = index * h;
    const bottom = top + h;
    const scrollTop = el.scrollTop;
    const viewHeight = el.clientHeight;

    if (top < scrollTop) {
      el.scrollTo({ top, behavior: "smooth" });
    } else if (bottom > scrollTop + viewHeight) {
      el.scrollTo({ top: bottom - viewHeight, behavior: "smooth" });
    } else {
      const prev = thumbRefs.current[index - 1];
      const next = thumbRefs.current[index + 1];
      if (prev && (index - 1) * h < scrollTop) {
        el.scrollTo({ top: (index - 1) * h, behavior: "smooth" });
        return;
      }
      if (next && (index + 2) * h > scrollTop + viewHeight) {
        el.scrollTo({ top: (index + 2) * h - viewHeight, behavior: "smooth" });
      }
    }
  }

  return (
    <div className="flex h-[480px] border border-[var(--color-border)] bg-white shadow-[var(--elev-shadow-card)] md:h-[600px]">
      {hasMultiple && (
        <div
          ref={thumbListRef}
          className="flex h-full w-16 shrink-0 flex-col overflow-y-auto md:w-20 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {list.map((node, index) => {
            const isActive = index === active;
            return (
              <button
                key={`${node.url}-${index}`}
                ref={(el) => { thumbRefs.current[index] = el; }}
                type="button"
                onClick={() => selectImage(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden transition-all md:h-20 md:w-20 ${
                  isActive ? "ring-2 ring-inset ring-[var(--color-primary)]" : ""
                }`}
                aria-label={`View image ${index + 1} of ${list.length}`}
                aria-pressed={isActive}
              >
                <Image src={node.url} alt="" fill className="object-cover" sizes="80px" />
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-white">
        <Image
          src={main.url}
          alt={main.altText || productTitle}
          width={main.width || 1200}
          height={main.height || 1200}
          style={{ maxHeight: "100%", width: "auto", height: "auto", maxWidth: "100%" }}
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
        />
      </div>
    </div>
  );
}
