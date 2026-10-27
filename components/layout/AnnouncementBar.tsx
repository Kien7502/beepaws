"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SHIPS_TO } from "@/lib/store-policy";

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
 *
 * Visitors from outside the US (owner, 2026-10-21: US-only shipping) see one
 * fixed message instead — that we ship to the US only — so nobody finds out at
 * checkout. Their country comes from /api/geo (the host's geo header; none in
 * local dev), asked once per session. That message sits in the same grid cell
 * as the others, so switching to it never changes the bar's height.
 *
 * Keep every message to ONE line on a 320px phone: the longest sets the bar's
 * height for all. Measured 2026-10-27: "…it works for your dog, or your money
 * back" wrapped below 390px wide; "…it works, or your money back" fits at 320.
 * The guarantee message follows the refund policy (owner, 2026-10-27): never
 * "risk-free" / "no questions" / "money-back guarantee".
 */
const MESSAGES: ReactNode[] = [
  <>
    <b className="text-gold">60-day</b> promise{" "}— it works, or your money back
  </>,
  <>
    No anesthesia, no vet bill{" "}— <b className="text-gold">under $50</b>
  </>,
  <>
    <b className="text-gold">Quiet in the air</b>
    {" "}— even for skittish dogs
  </>,
];
const ABROAD: ReactNode = (
  <>
    We currently ship to the <b className="text-gold">{SHIPS_TO.name}</b> only
  </>
);
const ALL = [...MESSAGES, ABROAD];
const ABROAD_INDEX = MESSAGES.length;
const GEO_KEY = "beepaws.geo"; // sessionStorage: the visitor's country ("" = unknown)
const INTERVAL_MS = 4500;

export function AnnouncementBar() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [abroad, setAbroad] = useState(false);

  useEffect(() => {
    const apply = (country: string) => setAbroad(!!country && country !== SHIPS_TO.code);
    let cached: string | null = null;
    try {
      cached = sessionStorage.getItem(GEO_KEY);
    } catch {}
    if (cached !== null) {
      apply(cached);
      return;
    }
    fetch("/api/geo")
      .then((r) => r.json() as Promise<{ country: string | null }>)
      .then(({ country }) => {
        try {
          sessionStorage.setItem(GEO_KEY, country ?? "");
        } catch {}
        apply(country ?? "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (abroad || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
  }, [paused, abroad]);

  const shown = abroad ? ABROAD_INDEX : active;
  return (
    <div
      className="grid bg-cocoa px-2 py-2.5 text-center text-xs font-medium tracking-wide text-cream md:text-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {ALL.map((m, i) => {
        const leaving = !abroad && i === (active + MESSAGES.length - 1) % MESSAGES.length;
        const state = i === shown ? "translate-y-0 opacity-100" : leaving ? "-translate-y-1.5 opacity-0" : "translate-y-1.5 opacity-0";
        return (
          <p
            key={i}
            aria-hidden={i !== shown}
            className={`[grid-area:1/1] transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${state}`}
          >
            {m}
          </p>
        );
      })}
    </div>
  );
}
