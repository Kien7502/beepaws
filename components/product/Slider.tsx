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

type SliderNav = { active: number; last: number; go: (i: number) => void };

/**
 * One prev/next arrow.
 * - `inline` sits in a controls row; at an end it fades to 30% so the row keeps its shape.
 * - `overlay` floats over the card (see CardSlider's `overlayArrowsAt`): a solid
 *   chip so it reads over artwork, and at an end it HIDES — a ghosted arrow
 *   sitting on an image is just noise.
 */
export function SliderArrow({
  dir,
  active,
  last,
  go,
  noun = "slide",
  variant = "inline",
  className = "",
  style,
}: SliderNav & {
  dir: "prev" | "next";
  noun?: string;
  variant?: "inline" | "overlay";
  className?: string;
  style?: CSSProperties;
}) {
  const prev = dir === "prev";
  const look =
    variant === "overlay"
      ? "h-9 w-9 border border-line/60 bg-card/90 text-cocoa shadow-[0_4px_14px_-4px_rgba(74,46,22,0.35)] backdrop-blur-sm disabled:pointer-events-none disabled:opacity-0"
      : "h-8 w-8 border border-line text-brown disabled:opacity-30";
  return (
    <button
      type="button"
      onClick={() => go(active + (prev ? -1 : 1))}
      disabled={prev ? active === 0 : active === last}
      aria-label={`${prev ? "Previous" : "Next"} ${noun}`}
      className={`flex items-center justify-center rounded-full transition-opacity ${look} ${className}`}
      style={style}
    >
      {prev ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  );
}

/** Position dots. `labels` name each slide for the dots' aria-labels. */
export function SliderDots({
  active,
  go,
  labels,
  className = "",
}: Pick<SliderNav, "active" | "go"> & { labels: string[]; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
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
  );
}

/** Prev / dots / next in one row, under the slider. */
export function SliderControls({
  active,
  last,
  go,
  labels,
  noun = "slide",
  className = "",
}: SliderNav & { labels: string[]; noun?: string; className?: string }) {
  const nav = { active, last, go, noun };
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <SliderArrow dir="prev" {...nav} />
      <SliderDots active={active} go={go} labels={labels} />
      <SliderArrow dir="next" {...nav} />
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
  overlayArrowsAt,
}: {
  slides: ReactNode[];
  labels: string[];
  /** CSS length — the section's grid gap (e.g. "1.25rem" for gap-5). Also spaces
   *  the slides in motion, and is part of each step's offset. */
  gap: string;
  noun?: string;
  /**
   * Put the arrows on the SIDES of the card, vertically centred at this CSS `top`
   * (e.g. the middle of a square image), with only the dots left underneath.
   * For TALL cards: with arrows below, a big card pushed them off screen and
   * shoppers had to scroll just to find the next one. `cqw` units resolve against
   * the card's width. Omit for short text cards — overlaid arrows would sit on
   * their text, and arrows below are already in view.
   */
  overlayArrowsAt?: string;
}) {
  const { active, last, go, swipe } = useSlider(slides.length);
  const trackStyle = {
    gap,
    // One step = a full card plus the gap after it.
    "--slide-x": `calc(${active} * (-100% - ${gap}))`,
  } as CSSProperties;

  const many = slides.length > 1;
  const nav = { active, last, go, noun };
  const side = { variant: "overlay" as const, style: { top: overlayArrowsAt } };

  return (
    <div>
      {/* The arrows' positioning box. Phone-only, like everything slider-specific,
          so desktop layout is untouched: `relative` anchors the side arrows, and
          the inline-size container is what `cqw` in overlayArrowsAt measures. */}
      <div className={overlayArrowsAt ? "max-md:relative max-md:[container-type:inline-size]" : undefined}>
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
      {many && overlayArrowsAt && (
        <>
          {/* Outside the swipe area, so tapping an arrow is never read as a swipe. */}
          <SliderArrow dir="prev" {...nav} {...side} className="absolute left-2 z-20 -translate-y-1/2 md:hidden" />
          <SliderArrow dir="next" {...nav} {...side} className="absolute right-2 z-20 -translate-y-1/2 md:hidden" />
        </>
      )}
      </div>
      {many &&
        (overlayArrowsAt ? (
          <SliderDots active={active} go={go} labels={labels} className="mt-4 md:hidden" />
        ) : (
          <SliderControls active={active} last={last} go={go} labels={labels} noun={noun} className="mt-5 md:hidden" />
        ))}
    </div>
  );
}
