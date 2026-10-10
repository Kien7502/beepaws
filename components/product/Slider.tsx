"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LOCK, prefersReducedMotion, project, rubberband, springStep } from "@/lib/motion";

/**
 * Slider state, shared by every phone slider on the PDP (comparison table, pain
 * points, mechanism steps, use cases), so they all move alike. The finger
 * tracking is useSwipeTrack, below.
 */
export function useSlider(count: number) {
  const [active, setActive] = useState(0);
  const last = Math.max(0, count - 1);
  const clamp = (i: number) => Math.max(0, Math.min(last, i));
  const go = (i: number) => setActive(clamp(i));
  // Relative moves use a functional update. Computing `active + 1` from the render's
  // closure dropped taps: two taps (or a swipe and a tap) landing before React
  // re-rendered both read the same `active` and moved only one step.
  const step = (delta: number) => setActive((a) => clamp(a + delta));
  return { active, last, go, step };
}

// ─── Swipe that follows the finger ──────────────────────────────────────────
// The spring and gesture numbers live in lib/motion.ts (shared with the
// before/after divider). The release velocity is what makes a page feel thrown.

const MAX_VELOCITY = 4000; // px/s

type Gesture = {
  id: number;
  x0: number;
  y0: number;
  /** --drag when the finger came down (non-zero if it caught a settle). */
  drag0: number;
  /** Distance between two pages, px, measured at touch-down. */
  page: number;
  locked: boolean;
  samples: { t: number; x: number }[];
};

type Track = {
  host: HTMLElement | null;
  drag: number;
  velocity: number;
  settleFrame: number;
  moveFrame: number;
  nextDrag: number;
  gesture: Gesture | null;
  /** Release velocity, waiting for the page change it caused. */
  handoff: number | null;
  swallowClickUntil: number;
};

function writeDrag(t: Track, x: number) {
  t.drag = x;
  t.host?.style.setProperty("--drag", `${x}px`);
}

function stopTrack(t: Track) {
  if (t.settleFrame) cancelAnimationFrame(t.settleFrame);
  if (t.moveFrame) cancelAnimationFrame(t.moveFrame);
  t.settleFrame = 0;
  t.moveFrame = 0;
}

/** Spring --drag home to 0 from where it is, starting at `v0` px/s. */
function settle(t: Track, v0: number) {
  stopTrack(t);
  if (prefersReducedMotion()) {
    t.velocity = 0;
    writeDrag(t, 0);
    return;
  }
  let x = t.drag;
  let v = v0;
  let then = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - then) / 1000);
    then = now;
    [x, v] = springStep(x, v, dt);
    t.velocity = v;
    if (Math.abs(x) < 0.5 && Math.abs(v) < 20) {
      t.settleFrame = 0;
      t.velocity = 0;
      writeDrag(t, 0);
      return;
    }
    writeDrag(t, x);
    t.settleFrame = requestAnimationFrame(tick);
  };
  t.settleFrame = requestAnimationFrame(tick);
}

/** Finger speed at lift-off, px/s — 0 if it paused before lifting. */
function releaseVelocity(g: Gesture, e: ReactPointerEvent) {
  const newest = g.samples[g.samples.length - 1];
  const oldest = g.samples[0];
  if (!newest || e.timeStamp - newest.t > 80) return 0;
  const dt = (e.timeStamp - oldest.t) / 1000;
  if (dt <= 0) return 0;
  const v = (e.clientX - oldest.x) / dt;
  return Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, v));
}

/**
 * A paged slider that moves with the finger. Before this, a swipe was read only
 * at lift-off: nothing moved under the finger, then a fixed 420ms slide played.
 *
 * - 1:1: the slides follow the finger from the moment a swipe is recognised.
 * - Momentum: a flick lands where its speed projects (a short fast flick turns
 *   the page; so does a slow drag past the middle), one page per swipe, and the
 *   slide keeps the finger's speed as it settles: no seam between drag and
 *   animation.
 * - Past the first or last page it resists (rubber band) instead of stopping dead.
 * - Interruptible: a touch during the settle catches the slide where it is.
 * - Vertical swipes still scroll the page: the first 8px decide, and
 *   `touch-action` leaves vertical pans to the browser.
 * - Arrows, dots and outside changes (a variant pick) move with the same spring.
 *
 * The offset is ONE CSS variable, `--drag` (px), on the element the result is
 * spread onto; the moving parts add `var(--drag, 0px)` to their own transform.
 * Nothing in the gesture path re-renders React. Touch and pen only: desktop keeps
 * its arrows.
 */
export function useSwipeTrack(options: {
  index: number;
  last: number;
  onIndex: (i: number) => void;
  /** Distance between two pages in px, measured from the bound element. */
  measureStep: (host: HTMLElement) => number;
  /** False where the layout isn't a slider right now (the desktop grid). */
  enabled?: () => boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const track = useRef<Track>({
    host: null,
    drag: 0,
    velocity: 0,
    settleFrame: 0,
    moveFrame: 0,
    nextDrag: 0,
    gesture: null,
    handoff: null,
    swallowClickUntil: 0,
  });
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
    track.current.host = hostRef.current;
  });

  // A page change moves the base position by whole pages. Shift --drag by the
  // same amount so nothing jumps, then let the spring carry it home: from
  // wherever it is, at whatever speed it already has (a swipe's release speed,
  // or the speed of a settle that an arrow tap interrupted).
  const prevIndex = useRef(options.index);
  useLayoutEffect(() => {
    const t = track.current;
    const from = prevIndex.current;
    prevIndex.current = options.index;
    if (from === options.index || !t.host) return;
    const shift = (options.index - from) * latest.current.measureStep(t.host);
    writeDrag(t, t.drag + shift);
    if (t.gesture) {
      t.gesture.drag0 += shift;
      return;
    }
    const v = t.handoff ?? t.velocity;
    t.handoff = null;
    settle(t, v);
  }, [options.index]);

  useEffect(() => {
    const t = track.current;
    return () => stopTrack(t);
  }, []);

  function end(e: ReactPointerEvent<HTMLElement>, lifted: boolean) {
    const t = track.current;
    const g = t.gesture;
    if (!g || e.pointerId !== g.id) return;
    t.gesture = null;
    if (!g.locked) {
      // A tap: if it caught a settle mid-flight, let it finish.
      if (t.drag !== 0) settle(t, t.velocity);
      return;
    }
    if (t.moveFrame) {
      cancelAnimationFrame(t.moveFrame);
      t.moveFrame = 0;
      writeDrag(t, t.nextDrag);
    }
    t.swallowClickUntil = e.timeStamp + 400;
    const v = lifted ? releaseVelocity(g, e) : 0;
    const { index, last, onIndex } = latest.current;
    const landing = t.drag + project(v);
    let target = index;
    if (landing < -g.page / 2) target = index + 1;
    else if (landing > g.page / 2) target = index - 1;
    target = Math.max(0, Math.min(last, target));
    if (target === index) {
      settle(t, v);
      return;
    }
    t.handoff = v;
    onIndex(target);
    // If the page didn't change after all, don't leave the slide hanging.
    requestAnimationFrame(() => {
      if (t.handoff === null) return;
      const hv = t.handoff;
      t.handoff = null;
      settle(t, hv);
    });
  }

  return {
    ref: hostRef,
    style: { touchAction: "pan-y pinch-zoom" } as CSSProperties,
    onPointerDown(e: ReactPointerEvent<HTMLElement>) {
      const t = track.current;
      if (e.pointerType === "mouse" || t.gesture) return;
      if (latest.current.enabled && !latest.current.enabled()) return;
      stopTrack(t); // caught mid-settle: carry on from where it is
      t.gesture = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        drag0: t.drag,
        page: latest.current.measureStep(e.currentTarget),
        locked: false,
        samples: [],
      };
    },
    onPointerMove(e: ReactPointerEvent<HTMLElement>) {
      const t = track.current;
      const g = t.gesture;
      if (!g || e.pointerId !== g.id) return;
      if (!g.locked) {
        const dx = e.clientX - g.x0;
        const dy = e.clientY - g.y0;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < LOCK) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          // A scroll: the page has it.
          t.gesture = null;
          if (t.drag !== 0) settle(t, t.velocity);
          return;
        }
        g.locked = true;
        g.x0 = e.clientX; // follow from here, so the lock distance isn't a jump
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      g.samples.push({ t: e.timeStamp, x: e.clientX });
      while (g.samples.length > 2 && e.timeStamp - g.samples[0].t > 100) g.samples.shift();
      const { index, last } = latest.current;
      let d = g.drag0 + (e.clientX - g.x0);
      const max = index * g.page; // page 0 lines up at this offset
      const min = -(last - index) * g.page; // the last page lines up here
      if (d > max) d = max + rubberband(d - max, g.page);
      else if (d < min) d = min + rubberband(d - min, g.page);
      t.nextDrag = d;
      if (!t.moveFrame) {
        t.moveFrame = requestAnimationFrame(() => {
          t.moveFrame = 0;
          writeDrag(t, t.nextDrag);
        });
      }
    },
    onPointerUp(e: ReactPointerEvent<HTMLElement>) {
      end(e, true);
    },
    onPointerCancel(e: ReactPointerEvent<HTMLElement>) {
      end(e, false);
    },
    // A swipe that ends over something clickable must not also click it.
    onClickCapture(e: ReactMouseEvent<HTMLElement>) {
      if (e.timeStamp > track.current.swallowClickUntil) return;
      track.current.swallowClickUntil = 0;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}

type SliderNav = { active: number; last: number; go: (i: number) => void; step: (delta: number) => void };

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
  step,
  noun = "slide",
  variant = "inline",
  className = "",
  style,
}: Omit<SliderNav, "go"> & {
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
      onClick={() => step(prev ? -1 : 1)}
      disabled={prev ? active === 0 : active === last}
      aria-label={`${prev ? "Previous" : "Next"} ${noun}`}
      className={`flex items-center justify-center rounded-full transition-opacity print:hidden ${look} ${className}`}
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
    <div className={`flex items-center justify-center gap-2 print:hidden ${className}`}>
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
  step,
  labels,
  noun = "slide",
  className = "",
}: SliderNav & { labels: string[]; noun?: string; className?: string }) {
  const nav = { active, last, step, noun };
  return (
    <div className={`flex items-center justify-center gap-4 print:hidden ${className}`}>
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
  const { active, last, go, step } = useSlider(slides.length);
  const swipe = useSwipeTrack({
    index: active,
    last,
    onIndex: go,
    // One page = a card plus the gap after it: the distance between two cards.
    measureStep: (host) => {
      const cards = host.firstElementChild?.children;
      if (!cards?.length) return 0;
      const [a, b] = [cards[0] as HTMLElement, cards[1] as HTMLElement | undefined];
      return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
    },
    // From md up the cards are a grid, not a slider.
    enabled: () => window.matchMedia("(max-width: 767.98px)").matches,
  });
  const trackStyle = {
    gap,
    // One step = a full card plus the gap after it; --drag is the finger's offset.
    "--slide-x": `calc(${active} * (-100% - ${gap}) + var(--drag, 0px))`,
  } as CSSProperties;

  const many = slides.length > 1;
  const nav = { active, last, step, noun };
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
          // Print (the admin's PDF export): the phone strip stacks every card
          // instead of showing the current one - paper can't be swiped.
          className="flex md:grid md:grid-cols-3 max-md:[transform:translateX(var(--slide-x))] print:![transform:none] max-md:print:flex-col"
          style={trackStyle}
        >
          {slides.map((slide, i) => (
            // `grid` so the card inside stretches: equal heights in the phone strip
            // (flex stretches the wrappers to the tallest card) and in the desktop
            // grid, as before.
            <div key={i} className="grid w-full shrink-0 break-inside-avoid md:w-auto">
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
          <SliderControls active={active} last={last} go={go} step={step} labels={labels} noun={noun} className="mt-5 md:hidden" />
        ))}
    </div>
  );
}
