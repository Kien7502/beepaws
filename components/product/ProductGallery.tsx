"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import type { Image as ShopifyImage } from "@/types/shopify";
import { useIsInsideMediaSync, useProductMedia } from "./ProductMediaSync";

// useLayoutEffect emits a warning during SSR (it can't run there). For
// client-only measurement logic, the isomorphic alias is the standard pattern.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

  // Controlled-vs-uncontrolled: when wrapped in <ProductMediaSync>, the active
  // index is shared with VariantSelector so variant picks scroll the gallery.
  // Standalone usage falls back to local state.
  const isControlled = useIsInsideMediaSync();
  const media = useProductMedia();
  const [localActive, setLocalActive] = useState(0);
  const active = isControlled ? media.activeIndex : localActive;
  const setActive = (i: number) => {
    if (isControlled) media.setActiveIndex(i);
    else setLocalActive(i);
  };

  const [scrollOffset, setScrollOffset] = useState(0);
  // Initial null means "not measured yet". The thumb strip is hidden until the
  // first synchronous measurement completes, which prevents the visible "render
  // at default size then snap to measured size" flash.
  const [thumbSize, setThumbSize] = useState<number | null>(null);
  const hasMultiple = list.length > 1;
  const measureRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Resize-aware: compute thumb size so N whole thumbnails fill the container
  // exactly. useLayoutEffect runs synchronously after DOM commit but BEFORE
  // browser paint, so the initial size measurement is applied in the same
  // paint cycle as the first render — no visible flash from default to
  // measured size.
  useIsomorphicLayoutEffect(() => {
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

  // Scroll the strip so the active thumb is visible. Pulled out of the click
  // handler so it also runs when `active` changes from outside (e.g. via
  // VariantSelector → context).
  function scrollActiveIntoView(index: number) {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[index];
    const measure = measureRef.current;
    if (!strip || !thumb || !measure) return;

    const containerWidth = measure.clientWidth;
    const maxOff = Math.max(0, strip.scrollWidth - containerWidth);
    const thumbLeft = thumb.offsetLeft;
    const thumbRight = thumbLeft + thumb.offsetWidth;

    setScrollOffset((prev) => {
      let next = prev;
      if (thumbLeft < prev) {
        next = thumbLeft;
      } else if (thumbRight > prev + containerWidth) {
        next = thumbRight - containerWidth;
      } else {
        const prevThumb = thumbRefs.current[index - 1];
        const nextThumb = thumbRefs.current[index + 1];
        if (prevThumb && prevThumb.offsetLeft < prev) {
          next = prevThumb.offsetLeft;
        } else if (nextThumb && nextThumb.offsetLeft + nextThumb.offsetWidth > prev + containerWidth) {
          next = nextThumb.offsetLeft + nextThumb.offsetWidth - containerWidth;
        }
      }
      return Math.max(0, Math.min(next, maxOff));
    });
  }

  function selectImage(index: number) {
    setActive(index);
    scrollActiveIntoView(index);
  }

  // When `active` changes externally (variant pick → shared context → here),
  // mirror the same scroll behaviour clicks get.
  useEffect(() => {
    scrollActiveIntoView(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="@container flex flex-col gap-3 lg:h-[calc(100svh-7.5rem)]">
      {/* Carousel-style slide: each image is absolutely stacked and translated
          based on its distance from the active index. When active changes, the
          CSS transition on `transform` slides them all together — the old
          image exits one way, the new image enters from the other. Picking a
          thumb to the right of current → image slides leftward (current exits
          left, new enters from right); vice versa. */}
      <div className="relative aspect-square lg:aspect-auto lg:flex-1 lg:max-h-[100cqi] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {list.map((node, idx) => {
          const offset = (idx - active) * 100;
          const isActive = idx === active;
          return (
            <div
              key={`${node.url}-${idx}`}
              className="absolute inset-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
              style={{ transform: `translateX(${offset}%)` }}
              aria-hidden={!isActive}
            >
              <Image
                src={node.url}
                alt={isActive ? node.altText || productTitle : ""}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 58vw"
                // All gallery images live in the same above-the-fold container
                // (just translated off-screen via CSS), so any of them could
                // be the LCP depending on which is active when the page loads.
                // Eager-load all + priority on the active one. Without this,
                // Next.js intermittently warns "LCP image not marked eager"
                // when the LCP doesn't happen to be index 0.
                loading="eager"
                priority={isActive}
              />
            </div>
          );
        })}
      </div>

      {/* Thumbnail strip — thumbs grow to fill container width with no leftover.
          measureRef is always mounted so we can read clientWidth; the inner
          strip stays hidden (opacity:0) until thumbSize is measured to avoid a
          visible "default size → measured size" snap. We reserve the typical
          square footprint via min-height so the layout doesn't shift either. */}
      {hasMultiple && (
        <div
          ref={measureRef}
          className="w-full overflow-hidden"
          style={{ minHeight: thumbSize ?? 96 }}
        >
          <div
            ref={stripRef}
            className="flex flex-row gap-2 transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${scrollOffset}px)`,
              opacity: thumbSize == null ? 0 : 1,
            }}
          >
            {list.map((node, index) => {
              const isActive = index === active;
              return (
                <button
                  key={`${node.url}-${index}`}
                  ref={(el) => { thumbRefs.current[index] = el; }}
                  type="button"
                  onClick={() => selectImage(index)}
                  style={{ width: thumbSize ?? 0, height: thumbSize ?? 0 }}
                  className={`relative shrink-0 overflow-hidden rounded-xl transition-all border-2 ${
                    isActive
                      ? "border-[var(--color-primary)]"
                      : "border-[var(--color-border)] opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`View image ${index + 1} of ${list.length}`}
                  aria-pressed={isActive}
                >
                  {/* Skip the Image until we have a measured size — Next/Image
                      with `fill` errors when its parent has zero height. */}
                  {thumbSize !== null && (
                    <Image src={node.url} alt="" fill className="object-cover" sizes="112px" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
