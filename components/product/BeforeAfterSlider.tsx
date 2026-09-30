"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { BeforeAfterSlide } from "@/types/metafields";

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
              className="mt-5 flex items-center justify-center gap-4"
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
function BeforeAfterPanel({ slide, hint = false }: { slide: BeforeAfterSlide; hint?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const pos = useRef(50); // divider position, 4-96 (%)
  const rect = useRef<{ left: number; width: number } | null>(null);
  const pendingX = useRef<number | null>(null);
  const frame = useRef(0);
  const dragging = useRef(false);
  const touched = useRef(false); // any user input stops (or pre-empts) the hint
  const hintFrame = useRef(0);

  // Clamps to 4-96 so the before/after labels stay visible at either extreme.
  const clamp = (p: number) => Math.max(4, Math.min(96, p));

  // The ONE write path: the CSS variable plus the slider's accessible value.
  // (React renders aria-valuenow and --pct once, at 50, and never rewrites
  // them, so these imperative updates survive re-renders.)
  const apply = useCallback((p: number) => {
    pos.current = p;
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--pct", String(p));
    el.setAttribute("aria-valuenow", String(Math.round(p)));
  }, []);

  function stopHint() {
    touched.current = true;
    if (hintFrame.current) cancelAnimationFrame(hintFrame.current);
    hintFrame.current = 0;
  }

  // Many pointer events per frame, one write per frame.
  function queue(clientX: number) {
    pendingX.current = clientX;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const x = pendingX.current;
      const r = rect.current;
      if (x == null || !r || r.width === 0) return;
      apply(clamp(((x - r.left) / r.width) * 100));
    });
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    stopHint();
    e.currentTarget.setPointerCapture(e.pointerId);
    // Measured once per drag, not per move: the panel doesn't move under a
    // horizontal drag, and re-reading layout every event forced reflows.
    const r = e.currentTarget.getBoundingClientRect();
    rect.current = { left: r.left, width: r.width };
    dragging.current = true;
    queue(e.clientX);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragging.current) queue(e.clientX);
  }
  function onPointerUp() {
    dragging.current = false;
  }

  // Keyboard path for the divider - the drag handle is otherwise pointer-only,
  // which locks out keyboard/AT users entirely. Arrow keys nudge, Shift jumps,
  // Home/End snap to the clamp extremes (4/96, same as the pointer clamp).
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 4;
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = pos.current - step;
    else if (e.key === "ArrowRight") next = pos.current + step;
    else if (e.key === "Home") next = 4;
    else if (e.key === "End") next = 96;
    if (next === null) return;
    e.preventDefault();
    stopHint();
    apply(clamp(next));
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
      onPointerCancel={onPointerUp}
      // pan-y (not touch-none): horizontal drags drive the divider, but a
      // vertical swipe starting on the image still scrolls the page - with
      // touch-none a near-full-width panel became a scroll trap on phones.
      // [--pct:50] is the server-rendered start; `apply` overrides it inline.
      className="relative aspect-[4/3] cursor-ew-resize overflow-hidden select-none [--pct:50] [touch-action:pan-y] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-inset"
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
        <div className="absolute left-0 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-clay shadow-[0_8px_24px_-8px_rgba(74,46,22,0.4)]">
          <ArrowLeftRight size={16} />
        </div>
      </div>
    </div>
  );
}
