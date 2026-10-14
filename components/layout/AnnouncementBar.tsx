"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * The cocoa announcement bar: three short positioning messages, one at a time
 * (PDP revision round 2 #1, 2026-10-14). No call to action on any of them — the
 * bar does positioning, the page does the selling. Honest claims only (no fake
 * countdowns) and no free-shipping promise (owner, 2026-10-13).
 *
 * All messages share one grid cell, so the bar is always as tall as the longest
 * and never shifts the page. Each new message rises in from just below while the
 * old one leaves upward — always the same direction, like a ticker. Rotation
 * pauses while the bar is hovered or focused and while the tab is hidden; with
 * reduced motion it stays on the first message (a slow endless loop is exactly
 * what that setting asks to stop). Inactive messages are aria-hidden, so a
 * screen reader reads the one on show and isn't interrupted by the rotation.
 * The no-break space before each dash keeps it on the first word's line.
 */
const MESSAGES: ReactNode[] = [
  <>
    <b className="text-gold">60-day</b> risk-free guarantee{" "}— no questions, no hassle
  </>,
  <>
    No anesthesia, no vet bill{" "}— <b className="text-gold">under $50</b>
  </>,
  <>
    <b className="text-gold">Quiet in the air</b>
    {" "}— even for skittish dogs
  </>,
];
const INTERVAL_MS = 4500;

export function AnnouncementBar() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const start = () => {
      window.clearInterval(timer);
      if (document.visibilityState === "visible") {
        timer = window.setInterval(() => setActive((i) => (i + 1) % MESSAGES.length), INTERVAL_MS);
      }
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", start);
    };
  }, [paused]);

  return (
    <div
      className="grid bg-cocoa px-2 py-2.5 text-center text-xs font-medium tracking-wide text-cream md:text-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {MESSAGES.map((m, i) => {
        const state = i === active ? "translate-y-0 opacity-100" : i === (active + MESSAGES.length - 1) % MESSAGES.length ? "-translate-y-1.5 opacity-0" : "translate-y-1.5 opacity-0";
        return (
          <p
            key={i}
            aria-hidden={i !== active}
            className={`[grid-area:1/1] transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${state}`}
          >
            {m}
          </p>
        );
      })}
    </div>
  );
}
