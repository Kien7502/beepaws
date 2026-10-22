"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export interface FAQRow {
  q: string;
  a: string;
  // Already-rendered glyph, resolved by the SERVER parent. It arrives as a node
  // rather than a component because resolving it here would mean importing the
  // whole icon catalog into the client bundle — see lib/content-icons.ts. Colour
  // is applied by the wrapper below via currentColor, so the open/closed tint
  // still animates even though the element itself is fixed. The compact
  // variant shows no icon, so it may be omitted there.
  icon?: ReactNode;
}

// The interactive half of the FAQ: which row is open. Deliberately the ONLY
// client code in the section — heading, data and icons are all server-rendered.
//
// Two looks, ONE behaviour (2026-09-30): `card` is the FAQ section; `compact`
// is the buy box's short list under Add to cart. The buy box used to be a
// native <details>, which snaps open while this animates — the owner noticed
// the two didn't match. Sharing the component means the open/close motion can
// never drift apart again, and it adds no JS (this already ships for the FAQ
// section on the same page).
export function FAQAccordion({ rows, variant = "card" }: { rows: FAQRow[]; variant?: "card" | "compact" }) {
  const [open, setOpen] = useState<number | null>(null);
  const compact = variant === "compact";

  return (
    <div className={compact ? undefined : "space-y-3"}>
      {rows.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div
            key={faq.q}
            className={
              compact
                ? "border-b border-line last:border-0"
                : "rounded-[13px] border border-line bg-card overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)]"
            }
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className={
                compact
                  ? "flex w-full items-center justify-between gap-3 py-2 text-left"
                  : "flex w-full items-center gap-4 px-5 py-4 text-left"
              }
              aria-expanded={isOpen}
            >
              {!compact && (
                <span
                  className={`inline-flex shrink-0 transition-colors duration-200 ${
                    isOpen ? "text-clay" : "text-brown"
                  }`}
                >
                  {faq.icon}
                </span>
              )}
              <span className={compact ? "text-[13.5px] font-bold text-cocoa" : "flex-1 font-extrabold text-cocoa"}>
                {faq.q}
              </span>
              <Plus
                className={`${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0 text-gold-deep transition-transform duration-200`}
                style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                aria-hidden
              />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p
                  className={`${
                    compact ? "pb-2 text-[13px]" : "pb-5 pl-14 pr-5 text-[14.5px]"
                  } leading-relaxed text-brown transition-opacity duration-200 ${
                    isOpen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
