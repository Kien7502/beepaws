"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Image as ShopifyImage } from "@/types/shopify";

type Props = {
  productTitle: string;
  images: { node: ShopifyImage }[];
  fallbackUrl: string;
};

const GAP = 8; // gap-2
const THUMB_MIN = 90; // target minimum size — controls how many fit per row

export function ProductGallery({ productTitle, images, fallbackUrl }: Props) {
  const list =
    images.length > 0
      ? images.map((e) => e.node)
      : [{ url: fallbackUrl, altText: productTitle, width: 1200, height: 1200 }];

  const [active, setActive] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [thumbSize, setThumbSize] = useState<number>(80);
  const main = list[active] ?? list[0];
  const hasMultiple = list.length > 1;
  const measureRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Resize-aware: compute thumb size so N whole thumbnails fill the container exactly
  useEffect(() => {
    if (!hasMultiple) return;
    const el = measureRef.current;
    if (!el) return;

    const recompute = () => {
      const available = el.clientWidth;
      const n = Math.max(3, Math.min(6, Math.floor((available + GAP) / (THUMB_MIN + GAP))));
      setThumbSize((available - (n - 1) * GAP) / n);
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasMultiple]);

  function selectImage(index: number) {
    setActive(index);
    const strip = stripRef.current;
    const thumb = thumbRefs.current[index];
    const measure = measureRef.current;
    if (!strip || !thumb || !measure) return;

    const containerWidth = measure.clientWidth;
    const maxOff = Math.max(0, strip.scrollWidth - containerWidth);
    const thumbLeft = thumb.offsetLeft;
    const thumbRight = thumbLeft + thumb.offsetWidth;

    let next = scrollOffset;

    if (thumbLeft < scrollOffset) {
      next = thumbLeft;
    } else if (thumbRight > scrollOffset + containerWidth) {
      next = thumbRight - containerWidth;
    } else {
      const prev = thumbRefs.current[index - 1];
      const nextThumb = thumbRefs.current[index + 1];
      if (prev && prev.offsetLeft < scrollOffset) {
        next = prev.offsetLeft;
      } else if (nextThumb && nextThumb.offsetLeft + nextThumb.offsetWidth > scrollOffset + containerWidth) {
        next = nextThumb.offsetLeft + nextThumb.offsetWidth - containerWidth;
      }
    }

    setScrollOffset(Math.max(0, Math.min(next, maxOff)));
  }

  return (
    <div className="@container flex flex-col gap-3 lg:h-[calc(100svh-7.5rem)]">
      {/* Main image: square on mobile, fills remaining viewport height on desktop, capped at 1:1 via cqi */}
      <div className="relative aspect-square lg:aspect-auto lg:flex-1 lg:max-h-[100cqi] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Image
          src={main.url}
          alt={main.altText || productTitle}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
        />
      </div>

      {/* Thumbnail strip — thumbs grow to fill container width with no leftover */}
      {hasMultiple && (
        <div ref={measureRef} className="w-full overflow-hidden">
          <div
            ref={stripRef}
            className="flex flex-row gap-2 transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${scrollOffset}px)` }}
          >
            {list.map((node, index) => {
              const isActive = index === active;
              return (
                <button
                  key={`${node.url}-${index}`}
                  ref={(el) => { thumbRefs.current[index] = el; }}
                  type="button"
                  onClick={() => selectImage(index)}
                  style={{ width: thumbSize, height: thumbSize }}
                  className={`relative shrink-0 overflow-hidden rounded-xl transition-all border-2 ${
                    isActive
                      ? "border-[var(--color-primary)]"
                      : "border-[var(--color-border)] opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`View image ${index + 1} of ${list.length}`}
                  aria-pressed={isActive}
                >
                  <Image src={node.url} alt="" fill className="object-cover" sizes="112px" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
