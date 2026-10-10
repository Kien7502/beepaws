"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { BeforeAfterSlide } from "@/types/metafields";
import { LOCK, prefersReducedMotion, rubberband, springStep } from "@/lib/motion";

// Plan §Phase 4: drag-to-reveal slider, one card per Shopify
// beepaws.before_after_slides entry. With more than one slide, the slider
// scrolls horizontally on translateX and the prev/next arrows + dot
// indicators live in a controls row BELOW the image so they don't fight the
// drag-reveal interaction. Each panel keeps its own drag-pct, so navigating
// back to a previously-viewed pet preserves the user's drag position.

// Lorem ipsum placeholders — set beepaws.before_after_slides to override
// with real customer stories and image URLs.
const DEFAULT_SLIDES: BeforeAfterSlide[] = [
  {
    beforeImageUrl: "",
    afterImageUrl: "",
    beforeLabel: "Before",
    afterLabel: "After",
    petName: "Placeholder pet one",
    caption:
      "\"Lorem ipsum dolor sit amet, consectetur adipiscing elit — placeholder caption one.\"",
  },
  {
    beforeImageUrl: "",
    afterImageUrl: "",
    beforeLabel: "Before",
    afterLabel: "After",
    petName: "Placeholder pet two",
    caption:
      "\"Ut enim ad minim veniam, quis nostrud exercitation ullamco — placeholder caption two.\"",
  },
  {
    beforeImageUrl: "",
    afterImageUrl: "",
    beforeLabel: "Before",
    afterLabel: "After",
    petName: "Placeholder pet three",
    caption:
      "\"Duis aute irure dolor in reprehenderit — placeholder caption three.\"",
  },
];

interface Props {
  slides?: BeforeAfterSlide[] | null;
  eyebrow?: string;
  heading?: string;
  lead?: string;
}

export function BeforeAfterSlider({
  slides,
  heading = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  lead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
}: Props) {
  const data = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [activeIdx, setActiveIdx] = useState(0);
  const multi = data.length > 1;
  const activeSlide = data[activeIdx] ?? data[0];

  function goToSlide(idx: number) {
    const next = ((idx % data.length) + data.length) % data.length;
    setActiveIdx(next);
  }

  return (
    <section className="ds-reveal-in bg-card py-14 md:py-20">
      {/* items-START, not center (2026-09-21): the left column's height changes
          with each slide's caption, and centring made the image column shift
          up and down as you clicked through. The caption is also placed into
          the second row so that on phones - where this stacks - the image
          comes BEFORE it and stays put. grid-rows-[auto_1fr] keeps the quote
          directly under the lead: without it the two left rows split the
          image's height and left a hole between them. */}
      <div className="container mx-auto grid max-w-6xl items-start gap-6 px-4 md:grid-cols-[43fr_57fr] md:grid-rows-[auto_1fr] md:gap-x-14 md:gap-y-6 md:px-6">
        {/* Left, row 1: the argument. */}
        <div className="md:col-start-1 md:row-start-1">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
            {heading}
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-brown">
            {lead}
          </p>

          <p className="mt-5 inline-flex items-center gap-2 text-sm text-brown/70">
            <ArrowLeftRight size={16} className="text-clay" aria-hidden />
            Drag the handle to compare.
          </p>
        </div>

        {/* Right: the drag-to-reveal slider, filling the column. row-start-1 +
            row-span-2 on desktop; in DOM order it sits between the heading and
            the caption, which is exactly the phone stacking we want. */}
        <div className="md:col-start-2 md:row-start-1 md:row-span-2">
          {/* Track viewport: clips overflow so the off-screen slides stay
              hidden, and rounds + shadows the visible image area. */}
          <div className="overflow-hidden rounded-2xl border border-line shadow-[0_14px_40px_-16px_rgba(74,46,22,0.22)]">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIdx * 100}%)` }}
            >
              {data.map((slide, idx) => (
                <div key={idx} className="w-full shrink-0">
                  <BeforeAfterPanel slide={slide} hint={idx === 0} />
                </div>
              ))}
            </div>
          </div>

          {multi && (
            <div
              className="mt-5 flex items-center justify-center gap-4 print:hidden"
              role="tablist"
              aria-label="Before-and-after gallery"
            >
              <button
                type="button"
                onClick={() => goToSlide(activeIdx - 1)}
                aria-label="Previous slide"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-cocoa shadow-sm transition hover:border-clay hover:text-clay"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                {data.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIdx}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => goToSlide(i)}
                    className="group flex h-10 min-w-[1.75rem] items-center justify-center"
                  >
                    {/* Visual dot stays small; the button provides the ~40px hit area. */}
                    <span
                      className={`h-2.5 rounded-full transition-all ${
                        i === activeIdx
                          ? "w-7 bg-clay"
                          : "w-2.5 bg-line group-hover:bg-brown/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => goToSlide(activeIdx + 1)}
                aria-label="Next slide"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-cocoa shadow-sm transition hover:border-clay hover:text-clay"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
        {/* Left, row 2 — BELOW the image on phones. The quote tracks the active
            slide, so the copy earns its column. */}
        <div className="md:col-start-1 md:row-start-2">
          {activeSlide.caption && (
            <figure className="border-t border-line pt-5 md:mt-0">
              <blockquote className="font-display text-lg italic leading-snug text-cocoa">
                {activeSlide.caption}
              </blockquote>
              {activeSlide.petName && (
                <figcaption className="mt-2 text-sm font-semibold text-brown">
                  — {activeSlide.petName}
                </figcaption>
              )}
            </figure>
          )}

        </div>

      </div>
    </section>
  );
}

// Per-slide drag-to-reveal panel. Each instance owns its own position so
// revisiting a previously-seen slide keeps the divider where the user left it.
//
// SMOOTH DRAG (2026-09-30, owner asked for smoother sliding). The position used
// to be React state, so every pointermove re-rendered the whole panel (both
// photos), re-measured it, and moved the divider with `left` - layout work on
// every event, 60-120 times a second on a phone. Now it lives in a ref and ONE
// CSS variable, --pct, is written at most once per animation frame: the divider
// and knob ride a `transform` (compositor only, no layout) and the after-photo a
// clip-path. Nothing in the drag path touches React. The first-view hint below
// writes through the same `apply`, so the two can never fight.
//
// FLUID DIVIDER (2026-10-10, apple-design pass). One loop drives --pct:
// - glued: the divider follows the pointer 1:1, keeping where on the knob it was
//   grabbed (no jump to the knob's centre), with a rubber band past 4/96 that
//   springs back on release;
// - otherwise a spring carries it to `target`: a tap or click GLIDES there
//   instead of teleporting, and if the pointer stays down it hands over to 1:1
//   once it has caught up. Keys glide too, and quick presses add up.
// On a phone nothing moves until the finger has gone 8px sideways. Before, a
// scroll that merely STARTED on the photo yanked the divider to the finger:
// pointerdown fires before the browser claims the vertical pan. The knob grows
// the moment it's pressed, so grabbing it answers at once.
const MIN = 4; // the clamp keeps the before/after labels visible at either end
const MAX = 96;
const clampPct = (p: number) => Math.max(MIN, Math.min(MAX, p));
/** How far (px) from the divider a press still counts as grabbing the knob:
 *  the knob's 22px radius plus some slack for a thumb. */
const KNOB_REACH = 32;

type Press = {
  id: number;
  x0: number;
  y0: number;
  touch: boolean;
  onKnob: boolean;
  locked: boolean;
  /** Divider minus pointer, px, so a grabbed knob doesn't jump to the finger. */
  offset: number;
  left: number;
  width: number;
};

function BeforeAfterPanel({ slide, hint = false }: { slide: BeforeAfterSlide; hint?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const pos = useRef(50); // divider position on screen, % (4-96 at rest)
  const touched = useRef(false); // any user input stops (or pre-empts) the hint
  const hintFrame = useRef(0);
  const press = useRef<Press | null>(null);
  const drive = useRef({ target: 50, velocity: 0, frame: 0, glued: false, held: false });

  // The ONE write path: the CSS variable plus the slider's accessible value.
  // (React renders aria-valuenow and --pct once, at 50, and never rewrites
  // them, so these imperative updates survive re-renders.)
  const apply = useCallback((p: number) => {
    pos.current = p;
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--pct", String(p));
    el.setAttribute("aria-valuenow", String(Math.round(clampPct(p))));
  }, []);

  useEffect(() => {
    const d = drive.current;
    return () => cancelAnimationFrame(d.frame);
  }, []);

  function stopHint() {
    touched.current = true;
    if (hintFrame.current) cancelAnimationFrame(hintFrame.current);
    hintFrame.current = 0;
    // Anything that starts from here starts from where the divider really is.
    if (!drive.current.frame) drive.current.target = pos.current;
  }

  function setGrabbed(on: boolean) {
    wrapRef.current?.toggleAttribute("data-grabbed", on);
  }

  // One write per frame, however many pointer events arrive.
  function run() {
    const d = drive.current;
    if (d.frame) return;
    let then = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - then) / 1000);
      then = now;
      if (d.glued || prefersReducedMotion()) {
        apply(d.target);
        d.velocity = 0;
      } else {
        const [x, v] = springStep(pos.current - d.target, d.velocity, dt);
        d.velocity = v;
        // Held: within ~2px of the pointer is close enough to hand over to 1:1
        // (a critically damped spring creeps the last pixels, so waiting for an
        // exact match left the divider trailing a moving pointer).
        const caughtUp = d.held ? Math.abs(x) < 0.6 : Math.abs(x) < 0.05 && Math.abs(v) < 0.5;
        if (caughtUp) {
          apply(d.target);
          d.velocity = 0;
          if (d.held) d.glued = true; // caught up with a held pointer: follow it 1:1
        } else {
          apply(d.target + x);
        }
      }
      if (!d.held && d.velocity === 0 && pos.current === d.target) {
        d.frame = 0;
        return;
      }
      d.frame = requestAnimationFrame(tick);
    };
    d.frame = requestAnimationFrame(tick);
  }

  /** Where the pointer puts the divider, %, with a rubber band past 4/96. The
   *  band's size is the 4% margin itself: it can approach the panel's edge but
   *  never leave the photo. */
  function follow(p: Press, clientX: number) {
    const raw = ((clientX + p.offset - p.left) / p.width) * 100;
    if (raw < MIN) return MIN - rubberband(MIN - raw, MIN);
    if (raw > MAX) return MAX + rubberband(raw - MAX, 100 - MAX);
    return raw;
  }

  function grab(p: Press, clientX: number) {
    const d = drive.current;
    // On the knob: hold the offset and follow at once. Anywhere else: the spring
    // brings the divider over to the pointer first.
    p.offset = p.onKnob ? p.left + (pos.current / 100) * p.width - clientX : 0;
    d.held = true;
    d.glued = p.onKnob;
    d.target = follow(p, clientX);
    setGrabbed(true);
    run();
  }

  function release() {
    const d = drive.current;
    d.held = false;
    d.glued = false;
    d.target = clampPct(d.target); // a rubber-banded divider springs back
    setGrabbed(false);
    run();
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stopHint();
    // Measured once per press, not per move: the panel doesn't move under a
    // horizontal drag, and re-reading layout every event forced reflows.
    const r = e.currentTarget.getBoundingClientRect();
    const knobX = r.left + (pos.current / 100) * r.width;
    const p: Press = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      touch: e.pointerType !== "mouse",
      onKnob: Math.abs(e.clientX - knobX) <= KNOB_REACH,
      locked: false,
      offset: 0,
      left: r.left,
      width: r.width,
    };
    press.current = p;
    if (!p.touch) {
      // A mouse has no scroll to tell apart: take it now.
      p.locked = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      grab(p, e.clientX);
      return;
    }
    // Touch waits for a direction, but a press on the knob answers at once.
    if (p.onKnob) setGrabbed(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = press.current;
    if (!p || e.pointerId !== p.id) return;
    if (!p.locked) {
      const dx = e.clientX - p.x0;
      const dy = e.clientY - p.y0;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < LOCK) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // A scroll: the page has it, and the divider never moved.
        press.current = null;
        setGrabbed(false);
        return;
      }
      p.locked = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      grab(p, e.clientX);
      return;
    }
    drive.current.target = follow(p, e.clientX);
    run();
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const p = press.current;
    if (!p || e.pointerId !== p.id) return;
    press.current = null;
    if (p.locked) {
      release();
      return;
    }
    // A tap: glide the divider to it.
    setGrabbed(false);
    drive.current.target = clampPct(((e.clientX - p.left) / p.width) * 100);
    run();
  }

  function onPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    const p = press.current;
    if (!p || e.pointerId !== p.id) return;
    press.current = null;
    if (p.locked) release();
    else setGrabbed(false);
  }

  // Keyboard path for the divider - the drag handle is otherwise pointer-only,
  // which locks out keyboard/AT users entirely. Arrow keys nudge, Shift jumps,
  // Home/End go to the clamp extremes (4/96, same as the pointer clamp). Steps
  // count from where the divider is HEADED, so quick presses add up.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 4;
    const d = drive.current;
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = d.target - step;
    else if (e.key === "ArrowRight") next = d.target + step;
    else if (e.key === "Home") next = MIN;
    else if (e.key === "End") next = MAX;
    if (next === null) return;
    e.preventDefault();
    stopHint();
    d.glued = false;
    d.target = clampPct(next);
    run();
  }

  // First-view hint (owner, 2026-09-30): the first time the section is well into
  // view, the divider sweeps left, right and back to centre - showing it can be
  // dragged without a word of instruction. Only the first slide gets `hint`, so
  // it plays once per page. It waits for the photos (a sweep over the loading
  // placeholder would show nothing), stops the instant the user touches or
  // presses a key, and never runs with reduced motion.
  useEffect(() => {
    const el = wrapRef.current;
    if (!hint || !loaded || !el || touched.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        timer = window.setTimeout(() => {
          if (touched.current) return;
          const DURATION = 1600;
          const AMP = 16;
          const start = performance.now();
          const tick = (now: number) => {
            if (touched.current) return;
            const t = Math.min(1, (now - start) / DURATION);
            // Eased overall (starts and ends at rest), one full swing inside:
            // 50 -> 34 (more "after" first, the payoff) -> 66 -> back to 50.
            const eased = (1 - Math.cos(Math.PI * t)) / 2;
            apply(50 - AMP * Math.sin(2 * Math.PI * eased));
            if (t < 1) hintFrame.current = requestAnimationFrame(tick);
            else {
              hintFrame.current = 0;
              apply(50);
            }
          };
          hintFrame.current = requestAnimationFrame(tick);
        }, 350);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      if (hintFrame.current) cancelAnimationFrame(hintFrame.current);
    };
  }, [hint, loaded, apply]);

  return (
    <div
      ref={wrapRef}
      role="slider"
      tabIndex={0}
      aria-label="Before-and-after comparison. Arrow keys move the divider."
      aria-valuemin={4}
      aria-valuemax={96}
      aria-valuenow={50}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      // pan-y (not touch-none): horizontal drags drive the divider, but a
      // vertical swipe starting on the image still scrolls the page - with
      // touch-none a near-full-width panel became a scroll trap on phones.
      // pinch-zoom keeps zooming in on the photo possible.
      // [--pct:50] is the server-rendered start; `apply` overrides it inline.
      className="group/ba relative aspect-[4/3] cursor-ew-resize overflow-hidden select-none [--pct:50] [touch-action:pan-y_pinch-zoom] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-inset"
    >
      {/* Loading placeholder (2026-09-30). The panel had no background of its
          own, so until the photos arrived you saw the white section through it:
          an empty box with two pills - on a phone that read as "nothing there"
          (owner). Now it reads as loading, in the site's own skeleton idiom
          (animate-pulse, like the cart drawer), and stops once the photo lands. */}
      <div aria-hidden className={`absolute inset-0 bg-honey-tint ${loaded ? "" : "animate-pulse"}`} />

      {/* BEFORE (full background) */}
      {slide.beforeImageUrl ? (
        <Image
          src={slide.beforeImageUrl}
          alt={`${slide.petName ?? "Pet"} — before`}
          fill
          // eager + LOW priority (2026-09-30): lazy made the fetch start only as
          // the section arrived - iPhone Safari waits until an image is nearly on
          // screen, and each phone-sized variant can also be a first-time MISS
          // at Vercel's image optimizer (measured up to 1.3s just to transcode).
          // Eager+low downloads them early without competing with the hero.
          loading="eager"
          fetchPriority="low"
          onLoad={() => setLoaded(true)}
          // draggable=false + pointer-events-none: without them a mouse drag
          // starts the browser's native IMAGE drag (ghost image) instead of
          // moving the divider, which also leaves the page feeling unscrollable.
          // The wrapper owns all pointer input, same as the divider/knob.
          draggable={false}
          className="pointer-events-none select-none object-cover"
          sizes="(max-width: 768px) 100vw, 620px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#8d7a55] to-[#6f5f3f] text-sm font-extrabold uppercase tracking-wider text-[#f3ecd9]">
          [ BEFORE — tartar buildup ]
        </div>
      )}

      {/* AFTER (clipped from the left at --pct) */}
      <div className="absolute inset-0" style={{ clipPath: "inset(0 0 0 calc(var(--pct) * 1%))" }}>
        {slide.afterImageUrl ? (
          <Image
            src={slide.afterImageUrl}
            alt={`${slide.petName ?? "Pet"} — after`}
            fill
            loading="eager"
            fetchPriority="low"
            draggable={false}
            className="pointer-events-none select-none object-cover"
            sizes="(max-width: 768px) 100vw, 620px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FBEFC9] to-[#F1D58F] text-sm font-extrabold uppercase tracking-wider text-[#7A4A12]">
            [ AFTER — one session ]
          </div>
        )}
      </div>

      {/* Corner tags */}
      <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
        {slide.beforeLabel ?? "Before"}
      </span>
      <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
        {slide.afterLabel ?? "After"}
      </span>

      {/* Divider line + knob, on ONE full-width layer translated by --pct% of its
          own width (= the panel's), so moving them is a compositor transform
          rather than layout. The panel's overflow-hidden clips the overhang. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{ transform: "translateX(calc(var(--pct) * 1%))" }}
      >
        <div className="absolute inset-y-0 left-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)]" />
        {/* Grows while held (data-grabbed on the panel): the press answers at
            once, before any movement. */}
        <div className="absolute left-0 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-clay shadow-[0_8px_24px_-8px_rgba(74,46,22,0.4)] transition-[scale,box-shadow] duration-150 ease-out group-data-[grabbed]/ba:scale-110 group-data-[grabbed]/ba:shadow-[0_10px_28px_-8px_rgba(74,46,22,0.5)]">
          <ArrowLeftRight size={16} />
        </div>
      </div>
    </div>
  );
}
