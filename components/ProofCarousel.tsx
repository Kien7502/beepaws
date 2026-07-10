"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Staged mobile carousel for the homepage proof cards (owner decision
// 2026-07-10, replacing the scroll-snap swipe version): explicit prev/next +
// dot BUTTONS instead of gestures — swipe misfires with accidental scrolls
// and wet hands; 44px taps don't. One card on stage at a time under md;
// ≥md all cards render as the usual 3-up grid and the controls disappear.
// Control row mirrors the PDP Before/After slider so the two carousels share
// one interaction language (arrows + pill dots), recolored for the bark band.

export interface ProofQuote {
  quote: string;
  breed: string;
}

export default function ProofCarousel({ quotes }: { quotes: ProofQuote[] }) {
  const [active, setActive] = useState(0);
  const go = (i: number) =>
    setActive(((i % quotes.length) + quotes.length) % quotes.length);

  return (
    <div>
      <div className="ds-stagger mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {quotes.map((t, i) => (
          /* bg-cream, no border: pure white glared on the bark band; the dark
             ground provides the edge definition. Non-active cards hide on
             mobile only — md+ shows all three. */
          <figure
            key={i}
            className={`ds-lift overflow-hidden rounded-2xl bg-cream ${
              i === active ? "" : "max-md:hidden"
            }`}
          >
            {/* Photo is the hero element. TODO: real customer-and-pet photo
                (owner's hand/arm in frame), permission given. No stock, ever. */}
            <div className="relative flex aspect-[4/3] items-center justify-center bg-honey-tint">
              <span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Customer + pet photo</span>
            </div>
            <div className="p-6 md:p-8">
              <blockquote className="text-lg leading-relaxed text-cocoa">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 text-sm">
                {/* TODO: real first name + breed (breed-matched proof converts hardest) */}
                <span className="font-bold text-cocoa">Name</span>
                <span className="text-brown"> · {t.breed}</span>
              </figcaption>
            </div>
          </figure>
        ))}
      </div>

      {/* Controls — mobile only. */}
      <div
        className="mt-6 flex items-center justify-center gap-4 md:hidden"
        role="group"
        aria-label="Browse reviews"
      >
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label="Previous review"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/30 text-cream transition-colors hover:border-gold hover:text-gold"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          {quotes.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to review ${i + 1}`}
              aria-pressed={i === active}
              onClick={() => go(i)}
              className="group flex h-11 min-w-[1.75rem] items-center justify-center"
            >
              <span
                className={`h-2.5 rounded-full transition-all ${
                  i === active ? "w-7 bg-gold" : "w-2.5 bg-cream/30 group-hover:bg-cream/50"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label="Next review"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/30 text-cream transition-colors hover:border-gold hover:text-gold"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
