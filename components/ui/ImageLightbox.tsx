"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export type LightboxImage = { url: string; alt: string };

const MAX_SCALE = 4;
const MIN_SCALE = 1;
const DOUBLE_TAP_SCALE = 2.5;

/**
 * Full-size image viewer, shared by the PDP gallery and the homepage proof
 * photos.
 *
 * Native <dialog> + showModal() rather than a hand-rolled overlay: callers sit
 * inside overflow-hidden / sticky containers where an absolutely-positioned
 * overlay would be clipped by its own ancestor. The browser's top layer escapes
 * every ancestor's overflow and stacking context, and brings focus trapping +
 * Esc-to-close from the platform.
 *
 * Zoom (2026-08-19): wheel / pinch / double-click to magnify, drag to pan.
 * Zoom resets whenever the image changes or the viewer closes, so it never
 * "remembers" a crop the user has moved on from.
 *
 * Controlled: the caller owns `open` and `index` so the viewer shares the
 * caller's notion of "current image", and closing leaves them where they
 * navigated to.
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
  const stageRef = useRef<HTMLDivElement>(null);
  const many = images.length > 1;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(0, images.length - 1));
  const current = images[safeIndex];

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const zoomed = scale > 1.01;

  // Pointer bookkeeping: one pointer pans, two pinch. `moved` suppresses the
  // backdrop-close click that would otherwise fire at the end of a drag.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const moved = useRef(false);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Keep panning inside the frame: at scale S the image can travel at most half
  // the overflow in each axis, so it can never be dragged fully out of view.
  const clamp = useCallback((x: number, y: number, s: number) => {
    const el = stageRef.current;
    if (!el) return { x, y };
    const maxX = (el.clientWidth * (s - 1)) / 2;
    const maxY = (el.clientHeight * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  const applyScale = useCallback(
    (next: number, focal?: { x: number; y: number }) => {
      const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      setOffset((prev) => {
        if (s <= 1.01) return { x: 0, y: 0 };
        const el = stageRef.current;
        if (!el || !focal) return clamp(prev.x, prev.y, s);
        // Keep the focal point (cursor / pinch centre) roughly stationary.
        const r = el.getBoundingClientRect();
        const cx = focal.x - (r.left + r.width / 2);
        const cy = focal.y - (r.top + r.height / 2);
        const ratio = s / (scale || 1);
        return clamp(prev.x - cx * (ratio - 1), prev.y - cy * (ratio - 1), s);
      });
      setScale(s);
    },
    [clamp, scale],
  );

  // Drive the real dialog from `open` — showModal()/close() are imperative.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // A new image must never inherit the previous one's zoom/pan. Adjusted
  // during render (React's sanctioned "derive state from a changed prop"
  // pattern) rather than in an effect: an effect would paint one frame at the
  // old zoom before snapping back, and it trips react-hooks/set-state-in-effect.
  const resetKey = `${open}:${safeIndex}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  const step = useCallback(
    (delta: number) => {
      if (!many) return;
      onIndexChange((safeIndex + delta + images.length) % images.length);
    },
    [many, onIndexChange, safeIndex, images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Arrows pan while zoomed, and page between images otherwise.
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        if (zoomed) setOffset((p) => clamp(p.x - dir * 60, p.y, scale));
        else step(dir);
      }
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, zoomed, scale, step, clamp, reset]);

  // Wheel / trackpad zoom. Non-passive so preventDefault actually stops the
  // page behind the dialog from scrolling under the gesture.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyScale(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), { x: e.clientX, y: e.clientY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, scale, applyScale]);

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const two = [...pointers.current.values()];
      pinchStart.current = { dist: dist(two[0], two[1]), scale };
      dragStart.current = null;
      setDragging(true);
    } else if (zoomed) {
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      setDragging(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const two = [...pointers.current.values()];
      const d = dist(two[0], two[1]);
      if (pinchStart.current.dist > 0) {
        moved.current = true;
        applyScale(pinchStart.current.scale * (d / pinchStart.current.dist), {
          x: (two[0].x + two[1].x) / 2,
          y: (two[0].y + two[1].y) / 2,
        });
      }
      return;
    }

    if (dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
      setOffset(clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, scale));
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) {
      dragStart.current = null;
      setDragging(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={() => {
        reset();
        onClose();
      }}
      onClick={(e) => {
        // The dialog element IS the backdrop, so a click landing on it rather
        // than its contents means "outside". Suppressed right after a
        // drag/pinch so releasing a pan never closes the viewer.
        if (e.target === ref.current && !moved.current) onClose();
      }}
      className="max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      style={{ width: "100vw", height: "100dvh" }}
      aria-label={label}
    >
      {/* Contents only exist while open, so a closed viewer costs no image
          payload on page load. */}
      {open && current && (
        <div className="relative flex h-full w-full items-center justify-center p-4 md:p-10">
          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onDoubleClick={(e) =>
              zoomed ? reset() : applyScale(DOUBLE_TAP_SCALE, { x: e.clientX, y: e.clientY })
            }
            // touch-none: the browser's own pan/zoom would fight ours.
            className={`relative h-full w-full touch-none overflow-hidden ${
              zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
            }`}
          >
            <div
              className="relative h-full w-full will-change-transform"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                // No transition mid-gesture — it would lag behind the finger.
                transition: dragging ? "none" : "transform 160ms ease-out",
              }}
            >
              <Image
                key={current.url}
                src={current.url}
                alt={current.alt}
                fill
                sizes="100vw"
                // object-contain: never crop the way the on-page frame crops.
                className="select-none object-contain"
                draggable={false}
                priority
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close full size view"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[var(--color-foreground)] shadow-lg transition-colors hover:bg-white md:right-6 md:top-6"
          >
            <X size={20} />
          </button>

          {/* Zoom controls — the discoverable path; wheel / pinch / double-click
              do the same thing for people who reach for them first. */}
          <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 px-1.5 py-1.5 backdrop-blur-sm md:top-6">
            <button
              type="button"
              onClick={() => applyScale(scale / 1.5)}
              disabled={scale <= MIN_SCALE + 0.01}
              aria-label="Zoom out"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ZoomOut size={18} />
            </button>
            <span className="min-w-[3.5ch] text-center text-xs font-bold tabular-nums text-white">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => applyScale(scale * 1.5)}
              disabled={scale >= MAX_SCALE - 0.01}
              aria-label="Zoom in"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ZoomIn size={18} />
            </button>
          </div>

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
