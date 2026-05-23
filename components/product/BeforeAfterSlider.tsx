"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowLeftRight } from "lucide-react";
import type { BeforeAfterSlide } from "@/types/metafields";

// Plan §Phase 4: replaces the static side-by-side BeforeAfterSection with an
// interactive drag-to-reveal slider matching the device reference. Uses the
// existing beepaws.before_after_slides metafield; renders the FIRST slide as
// the primary proof point (the reference shows one slider). When images are
// missing, we still render the structural placeholders so editors see the
// shape before real photography lands.

const DEFAULT_SLIDES: BeforeAfterSlide[] = [
  {
    beforeImageUrl: "",
    afterImageUrl: "",
    beforeLabel: "Before",
    afterLabel: "After 3 Sessions",
    petName: "Bella, 4yr Chihuahua",
    caption:
      "\"I cannot tell you how satisfying it was to see that hard plaque come off.\"",
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
  eyebrow = "Real results · drag to reveal",
  heading = "The before-and-after pictures speak for themselves",
  lead = "Real, un-retouched photos from pet parents — the only proof this audience trusts.",
}: Props) {
  const data = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const slide = data[0];

  const wrapRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const dragging = useRef(false);

  // Clamps to 4-96 so the labels stay visible at either extreme.
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

  return (
    <section className="bg-cream py-14 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">
        <span className="block text-center text-xs font-extrabold uppercase tracking-[0.14em] text-gold-deep mb-2.5">
          {eyebrow}
        </span>
        <h2 className="font-display mx-auto mb-3 max-w-2xl text-center text-3xl font-bold leading-tight tracking-tight text-cocoa md:text-[33px]">
          {heading}
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-base text-brown">
          {lead}
        </p>

        <div className="mx-auto max-w-[620px]">
          <div
            ref={wrapRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="relative aspect-[4/3] cursor-ew-resize overflow-hidden rounded-2xl border border-line shadow-[0_14px_40px_-16px_rgba(74,46,22,0.22)] select-none touch-none"
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
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 0 0 ${pct}%)` }}
            >
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
          </div>

          {slide.caption && (
            <p className="mt-4 text-center text-sm italic text-brown md:text-[13.5px]">
              {slide.caption}
              {slide.petName && <span className="not-italic"> — {slide.petName}</span>}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
