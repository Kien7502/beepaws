"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The listicle checklist's one moving part (owner, 2026-10-13). The sheet is
 * rendered by ListicleView with empty boxes; this sets `data-ticked` on it once
 * the reader has finished the list — its bottom edge risen past 70% of the
 * screen, i.e. the last row read and the next line ("…checks every box above")
 * coming up. The rows' `group-data-[ticked]/sheet:` styles do the rest: the
 * boxes fill and draw their ticks in a short top-to-bottom cascade. Once ticked
 * it stays ticked; landing below the list (a reload mid-page) ticks at once.
 * Print shows the ticked state through `print:` styles — no observer needed.
 */
export function ChecklistTicks({ children, className = "" }: { children: ReactNode; className?: string }) {
  const end = useRef<HTMLSpanElement>(null);
  const [ticked, setTicked] = useState(false);

  useEffect(() => {
    const el = end.current;
    if (!el || ticked) return;
    // The zone is everything ABOVE 70% of the screen (a huge top margin), not
    // just the visible part: an observer only fires when the marker crosses
    // the zone's edge, so with a viewport-sized zone a jump from below the
    // list to past it (a fast fling, a link) crossed nothing and never ticked.
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTicked(true);
          io.disconnect();
        }
      },
      { rootMargin: "100000px 0px -30% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ticked]);

  return (
    <div data-ticked={ticked ? "" : undefined} className={`group/sheet ${className}`}>
      {children}
      <span ref={end} aria-hidden className="block h-px" />
    </div>
  );
}
