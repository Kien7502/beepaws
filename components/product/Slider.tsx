"use client";

import { useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Slide easing — the same curve and duration as ProductGallery. */
export const SLIDE_EASE = "duration-[420ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]";

/**
 * Slider state + swipe, shared by every phone slider on the PDP (comparison
 * table, pain points, mechanism steps, use cases), so they all move alike.
 *
 * Swipe: phones expect it even with arrows. A 40px threshold plus a
 * horizontal-axis check is enough, and it leaves vertical page scrolling alone.
 * The touch origin lives in a ref — as state it re-rendered on every touchstart.
 */
export function useSlider(count: number) {
  const [active, setActive] = useState(0);
  const last = Math.max(0, count - 1);
  const go = (i: number) => setActive(Math.max(0, Math.min(last, i)));
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swipe = {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      touch.current = { x: t.clientX, y: t.clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      const start = touch.current;
      touch.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(active + (dx < 0 ? 1 : -1));
    },
  };
  return { active, last, go, swipe };
}

/** Prev / dots / next. `labels` name each slide for the dots' aria-labels. */
export function SliderControls({
  active,
  last,
  go,
  labels,
  noun = "slide",
  className = "",
}: {
  active: number;
  last: number;
  go: (i: number) => void;
  labels: string[];
  noun?: string;
  className?: string;
}) {
  const arrow =
    "flex h-8 w-8 items-center justify-center rounded-full border border-line text-brown transition-opacity disabled:opacity-30";
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label={`Previous ${noun}`} className={arrow}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        {labels.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show ${label}`}
            aria-pressed={i === active}
            className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-cocoa" : "w-2 bg-line"}`}
          />
        ))}
      </div>
      <button type="button" onClick={() => go(active + 1)} disabled={active === last} aria-label={`Next ${noun}`} className={arrow}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * A row of cards: a one-card-at-a-time slider on phones, the section's normal
 * grid from md up.
 *
 * The cards are rendered ONCE and CSS switches the layout. Rendering a phone copy
 * plus a desktop copy (what the comparison table does, because its two layouts
 * differ structurally) would duplicate every card here — and every image in
 * Mechanism and UseCaseCards. So below md the track is a flex strip moved by a
 * transform; from md it's `md:grid md:grid-cols-3`, and the transform is scoped
 * to `max-md:` so desktop never has one to override.
 *
 * Cards arrive as rendered nodes from the server section (next/image and any
 * server-only helpers stay on the server). They must carry their own `key`.
 *
 * No aria-hidden on off-screen cards: on desktop all three are on screen, and a
 * render-once layout can't tell which one it is without JS. These cards hold no
 * links or buttons, so a screen reader reading them in order is exactly right
 * and keyboard focus can't land on an off-screen card.
 */
export function CardSlider({
  slides,
  labels,
  gap,
  noun = "card",
}: {
  slides: ReactNode[];
  labels: string[];
  /** CSS length — the section's grid gap (e.g. "1.25rem" for gap-5). Also spaces
   *  the slides in motion, and is part of each step's offset. */
  gap: string;
  noun?: string;
}) {
  const { active, last, go, swipe } = useSlider(slides.length);
  const trackStyle = {
    gap,
    // One step = a full card plus the gap after it.
    "--slide-x": `calc(${active} * (-100% - ${gap}))`,
  } as CSSProperties;

  return (
    <div>
      {/* overflow-x-CLIP, not overflow-hidden: `hidden` would also clip the cards'
          drop shadows vertically and turn this into a scroll container. */}
      <div className="max-md:overflow-x-clip" {...swipe}>
        <div
          className={`flex md:grid md:grid-cols-3 max-md:[transform:translateX(var(--slide-x))] max-md:transition-transform ${SLIDE_EASE}`}
          style={trackStyle}
        >
          {slides.map((slide, i) => (
            // `grid` so the card inside stretches: equal heights in the phone strip
            // (flex stretches the wrappers to the tallest card) and in the desktop
            // grid, as before.
            <div key={i} className="grid w-full shrink-0 md:w-auto">
              {slide}
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <SliderControls active={active} last={last} go={go} labels={labels} noun={noun} className="mt-5 md:hidden" />
      )}
    </div>
  );
}
