"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Expand } from "lucide-react";
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
  // Controlled-vs-uncontrolled: when wrapped in <ProductMediaSync>, the active
  // index is shared with VariantSelector so variant picks scroll the gallery.
  // Standalone usage falls back to local state.
  const isControlled = useIsInsideMediaSync();
  const media = useProductMedia();

  // For a variant group the `images` prop is already the combined reel of every
  // member's images (built server-side in ProductPageView), so the gallery just
  // renders the list it's given — picking a flavour scrolls within it via the
  // shared activeIndex, no set-swap.
  const list =
    images.length > 0
      ? images.map((e) => e.node)
      : [{ url: fallbackUrl, altText: productTitle, width: 1200, height: 1200 }];
  const [localActive, setLocalActive] = useState(0);
  // Clamped: a shorter image set after a variant-group swap must never leave
  // the index pointing past the end.
  const active = Math.min(
    isControlled ? media.activeIndex : localActive,
    Math.max(0, list.length - 1),
  );
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

  // ── Lightbox (click the main image to see it full size) ──────────────────
  // Native <dialog> on purpose: the gallery lives inside an overflow-hidden,
  // position-sticky column, so a plain absolutely-positioned overlay would be
  // clipped by its own container. showModal() renders in the browser's top
  // layer, which escapes every ancestor's overflow and stacking context, and
  // brings focus trapping + Esc-to-close for free.
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  function openZoom() {
    setZoomOpen(true);
    dialogRef.current?.showModal();
  }
  function closeZoom() {
    dialogRef.current?.close();
  }
  // Keep the active image in sync while zoomed, and let arrow keys page
  // through — the same navigation the thumbs give, without leaving the zoom.
  function zoomStep(delta: number) {
    const next = (active + delta + list.length) % list.length;
    selectImage(next);
  }
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); zoomStep(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); zoomStep(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomOpen, active, list.length]);

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
      <div className="group relative aspect-square lg:aspect-auto lg:flex-1 lg:max-h-[100cqi] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
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

        {/* Click-to-zoom. A transparent button over the whole frame rather than
            an onClick on the image, so it is keyboard-reachable and announces
            itself; the corner pill is the visual affordance (pointer devices
            get it on hover, touch always, since there is no hover to reveal it). */}
        <button
          type="button"
          onClick={openZoom}
          className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          aria-label={`View ${list[active]?.altText || productTitle} full size`}
        >
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-foreground)]/70 px-3 py-1.5 text-xs font-semibold text-white opacity-100 backdrop-blur-sm transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <Expand size={14} aria-hidden />
            Full size
          </span>
        </button>
      </div>

      {/* Full-size viewer. Native <dialog> = top layer, so it is never clipped
          by the sticky/overflow-hidden gallery column, and Esc + focus trap
          come from the platform. `onClose` syncs React state for the backdrop
          click and the Esc key alike. */}
      <dialog
        ref={dialogRef}
        onClose={() => setZoomOpen(false)}
        onClick={(e) => {
          // Backdrop click: the dialog element itself is the backdrop, so a
          // click landing on it (not on its contents) means "outside".
          if (e.target === dialogRef.current) closeZoom();
        }}
        className="max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
        style={{ width: "100vw", height: "100dvh" }}
        aria-label={`${productTitle} images, full size`}
      >
        {zoomOpen && (
          <div className="relative flex h-full w-full items-center justify-center p-4 md:p-10">
            {/* The image itself. `sizes` at ~full viewport so Next serves a
                large candidate; object-contain so tall product shots are never
                cropped the way the thumbnail frame crops them. */}
            <div className="relative h-full w-full">
              <Image
                key={list[active]?.url}
                src={list[active]?.url ?? fallbackUrl}
                alt={list[active]?.altText || productTitle}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            <button
              type="button"
              onClick={closeZoom}
              aria-label="Close full size view"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[var(--color-foreground)] shadow-lg transition-colors hover:bg-white md:right-6 md:top-6"
            >
              <X size={20} />
            </button>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => zoomStep(-1)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--color-foreground)] shadow-lg transition-colors hover:bg-white md:left-6"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => zoomStep(1)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--color-foreground)] shadow-lg transition-colors hover:bg-white md:right-6"
                >
                  <ChevronRight size={22} />
                </button>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                  {active + 1} / {list.length}
                </span>
              </>
            )}
          </div>
        )}
      </dialog>

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
