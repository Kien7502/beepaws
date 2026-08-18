"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { ImageLightbox, type LightboxImage } from "@/components/ui/ImageLightbox";
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
      <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[43fr_57fr] md:gap-14 md:px-6">
        {/* Left: the argument, the current pet's story, and how to read it. The
            quote tracks the active slide, so the copy earns its column. */}
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
            {heading}
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-brown">
            {lead}
          </p>

          {activeSlide.caption && (
            <figure className="mt-6 border-t border-line pt-5">
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

          <p className="mt-6 inline-flex items-center gap-2 text-sm text-brown/70">
            <ArrowLeftRight size={16} className="text-clay" aria-hidden />
            Drag the handle to compare.
          </p>
        </div>

        {/* Right: the drag-to-reveal slider, filling the column. */}
        <div>
          {/* Track viewport: clips overflow so the off-screen slides stay
              hidden, and rounds + shadows the visible image area. */}
          <div className="overflow-hidden rounded-2xl border border-line shadow-[0_14px_40px_-16px_rgba(74,46,22,0.22)]">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIdx * 100}%)` }}
            >
              {data.map((slide, idx) => (
                <div key={idx} className="w-full shrink-0">
                  <BeforeAfterPanel slide={slide} />
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
      </div>
    </section>
  );
}

// Per-slide drag-to-reveal panel. Each instance owns its own pct so revisiting
// a previously-seen slide keeps the drag position the user left it at.
function BeforeAfterPanel({ slide }: { slide: BeforeAfterSlide }) {
  // Zoom: an EXPLICIT button, not click-anywhere on the frame — this panel is a
  // drag-to-compare surface, so a click handler on it would fight the drag (a
  // stray click ending a drag would pop the viewer open). Scoped per panel:
  // each slide zooms its OWN pair, and the viewer's arrows step between the
  // before and after of the same pet.
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoomImages: LightboxImage[] = [
    { url: slide.beforeImageUrl ?? "", alt: `${slide.petName ?? "Pet"} — before` },
    { url: slide.afterImageUrl ?? "", alt: `${slide.petName ?? "Pet"} — after` },
  ].filter((i) => i.url);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const dragging = useRef(false);

  // Clamps to 4-96 so the before/after labels stay visible at either extreme.
  const setFromClientX = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.max(4, Math.min(96, next)));
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setFromClientX(e.clientX);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  }
  function onPointerUp() {
    dragging.current = false;
  }

  // Keyboard path for the divider — the drag handle is otherwise pointer-only,
  // which locks out keyboard/AT users entirely. Arrow keys nudge, Shift jumps,
  // Home/End snap to the clamp extremes (4/96, same as the pointer clamp).
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 4;
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = pct - step;
    else if (e.key === "ArrowRight") next = pct + step;
    else if (e.key === "Home") next = 4;
    else if (e.key === "End") next = 96;
    if (next === null) return;
    e.preventDefault();
    setPct(Math.max(4, Math.min(96, next)));
  }

  return (
    <div
      ref={wrapRef}
      role="slider"
      tabIndex={0}
      aria-label="Before-and-after comparison. Arrow keys move the divider."
      aria-valuemin={4}
      aria-valuemax={96}
      aria-valuenow={Math.round(pct)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      // pan-y (not touch-none): horizontal drags drive the divider, but a
      // vertical swipe starting on the image still scrolls the page — with
      // touch-none a near-full-width panel became a scroll trap on phones.
      className="relative aspect-[4/3] cursor-ew-resize overflow-hidden select-none [touch-action:pan-y] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-inset"
    >
      {/* BEFORE (full background) */}
      {slide.beforeImageUrl ? (
        <Image
          src={slide.beforeImageUrl}
          alt={`${slide.petName ?? "Pet"} — before`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 620px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#8d7a55] to-[#6f5f3f] text-sm font-extrabold uppercase tracking-wider text-[#f3ecd9]">
          [ BEFORE — tartar buildup ]
        </div>
      )}

      {/* AFTER (clipped from the right by pct) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
        {slide.afterImageUrl ? (
          <Image
            src={slide.afterImageUrl}
            alt={`${slide.petName ?? "Pet"} — after`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 620px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FBEFC9] to-[#F1D58F] text-sm font-extrabold uppercase tracking-wider text-[#7A4A12]">
            [ AFTER — one session ]
          </div>
        )}
      </div>

      {/* Zoom affordance — a real button, positioned above the drag surface.
          stopPropagation so pressing it never starts a divider drag. Hidden
          entirely when the slide is still on placeholder art (nothing to
          inspect). */}
      {slide.beforeImageUrl && slide.afterImageUrl && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setZoomIndex(0);
            setZoomOpen(true);
          }}
          aria-label={`View ${slide.petName ?? "this"} before and after photos full size`}
          className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/75"
        >
          <Expand size={14} aria-hidden />
          Full size
        </button>
      )}

      {/* Corner tags */}
      <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
        {slide.beforeLabel ?? "Before"}
      </span>
      <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
        {slide.afterLabel ?? "After"}
      </span>

      {/* Divider line + knob */}
      <div
        className="pointer-events-none absolute inset-y-0 w-[3px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
        style={{ left: `${pct}%` }}
      />
      <div
        className="pointer-events-none absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-clay shadow-[0_8px_24px_-8px_rgba(74,46,22,0.4)]"
        style={{ left: `${pct}%` }}
      >
        <ArrowLeftRight size={16} />
      </div>

      <ImageLightbox
        images={zoomImages}
        index={zoomIndex}
        open={zoomOpen}
        onIndexChange={setZoomIndex}
        onClose={() => setZoomOpen(false)}
        label={`${slide.petName ?? "Pet"} before and after, full size`}
      />
    </div>
  );
}
