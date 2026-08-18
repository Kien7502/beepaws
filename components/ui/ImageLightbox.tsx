"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { url: string; alt: string };

/**
 * Full-size image viewer, shared by the PDP gallery, the before/after slider
 * and the homepage proof photos.
 *
 * Native <dialog> + showModal() rather than a hand-rolled overlay: callers sit
 * inside overflow-hidden / sticky / transformed containers (the gallery column,
 * the slider's clipping track), where an absolutely-positioned overlay would be
 * clipped by its own ancestor. The browser's top layer escapes every ancestor's
 * overflow and stacking context, and brings focus trapping + Esc-to-close from
 * the platform instead of bespoke key handling.
 *
 * Controlled: the caller owns `open` and `index` so the viewer can share the
 * caller's own notion of "current image" (the gallery's active slide, the
 * slider's active pair), and closing leaves them where they navigated to.
 */
export function ImageLightbox({
  images,
  index,
  open,
  onIndexChange,
  onClose,
  label,
}: {
  images: LightboxImage[];
  index: number;
  open: boolean;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  label: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const many = images.length > 1;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(0, images.length - 1));
  const current = images[safeIndex];

  // Drive the real dialog from the `open` prop — showModal()/close() are
  // imperative, so React state alone can't open it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const step = (delta: number) => {
    if (!many) return;
    onIndexChange((safeIndex + delta + images.length) % images.length);
  };

  useEffect(() => {
    if (!open || !many) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, many, safeIndex, images.length]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // The dialog element IS the backdrop, so a click landing on it rather
        // than its contents means "outside" → close.
        if (e.target === ref.current) onClose();
      }}
      className="max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      style={{ width: "100vw", height: "100dvh" }}
      aria-label={label}
    >
      {/* Contents only exist while open, so a closed viewer costs no image
          payload on page load. */}
      {open && current && (
        <div className="relative flex h-full w-full items-center justify-center p-4 md:p-10">
          <div className="relative h-full w-full">
            <Image
              key={current.url}
              src={current.url}
              alt={current.alt}
              fill
              sizes="100vw"
              // object-contain: never crop the way the on-page frame crops.
              className="object-contain"
              priority
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close full size view"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[var(--color-foreground)] shadow-lg transition-colors hover:bg-white md:right-6 md:top-6"
          >
            <X size={20} />
          </button>

          {many && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--color-foreground)] shadow-lg transition-colors hover:bg-white md:left-6"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next image"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--color-foreground)] shadow-lg transition-colors hover:bg-white md:right-6"
              >
                <ChevronRight size={22} />
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                {safeIndex + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}

/** Small corner affordance shared by the callers that zoom on frame-click.
 * Always visible on touch (no hover to reveal it), hover-revealed on pointer. */
export function ZoomHint({ label = "Full size" }: { label?: string }) {
  return (
    <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-foreground)]/70 px-3 py-1.5 text-xs font-semibold text-white opacity-100 backdrop-blur-sm transition-opacity md:opacity-0 md:group-hover:opacity-100">
      {label}
    </span>
  );
}
