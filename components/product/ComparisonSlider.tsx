"use client";

import { Fragment, type ReactNode } from "react";
import { useSlider, SliderControls, SLIDE_EASE } from "@/components/product/Slider";

export interface SliderColumn {
  label: string;
  // Rendered server-side — the icon catalog can't be imported here. Same
  // arrangement as FAQSection → FAQAccordion.
  icon: ReactNode;
}
export interface SliderRow {
  label: string;
  // One rendered cell per column, so the ✓/✕/price rendering lives in exactly
  // one place (ComparisonTable's `cell()`) and can't drift from the desktop table.
  cells: ReactNode[];
}

// Label rail | value column. Shared by the header and the card.
const GRID = "44% minmax(0, 1fr)";

// One row's worth of values, slid horizontally. Every row uses the same `active`
// index, so the whole column moves as one piece.
//
// Each value sits in normal flow at 100% of the viewport width — never absolute
// — so the row grows to fit its tallest value and long text WRAPS instead of
// being clipped at a column edge.
function Strip({
  active,
  children,
  className = "",
}: {
  active: number;
  children: ReactNode[];
  className?: string;
}) {
  // `h-full` on the track resolves because the Strip is a stretched grid item
  // (definite height), so slides — and the tint inside them — fill the whole row.
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={`flex h-full transition-transform ${SLIDE_EASE}`}
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {children.map((c, i) => (
          // `grid` (not plain block) so the cell inside stretches to the full row
          // height — otherwise the highlighted column's tint stops short of the
          // row divider on taller rows.
          <div key={i} className="grid w-full shrink-0" aria-hidden={i !== active}>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}

// Phone view of the comparison: the row labels are FIXED on the left and the
// option columns slide, one at a time, driven by the arrows/dots (and a swipe).
//
// Labels and values share ONE grid, which is what keeps them aligned: each grid
// row is as tall as the tallest thing in it, whether that's a three-line label or
// a wrapped price. Two side-by-side containers would need hardcoded row heights
// to stay in sync, and these labels are full sentences.
export function ComparisonSlider({
  columns,
  rows,
}: {
  columns: SliderColumn[];
  rows: SliderRow[];
}) {
  // State, swipe and controls are shared with the card sliders (Slider.tsx).
  const { active, last, go, swipe } = useSlider(columns.length);

  return (
    <div className="md:hidden">
      {/* Same geometry for header and card so the sliding header sits exactly
          over the value column. The header's transparent side borders mirror the
          card's 1px border — without them the two 44% splits resolve against
          widths 2px apart and the header drifts off the column. */}
      <div {...swipe}>
        {/* Header badge — above the card, like the desktop's column badges. */}
        <div className="mb-4 grid border-x border-transparent" style={{ gridTemplateColumns: GRID }}>
          <div />
          <Strip active={active}>
            {columns.map((col, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    i === 0 ? "bg-cocoa" : "bg-cream"
                  }`}
                >
                  {col.icon}
                </span>
                <span
                  className={`text-center text-xs uppercase tracking-wider ${
                    i === 0 ? "font-extrabold text-cocoa" : "font-bold text-brown"
                  }`}
                >
                  {col.label}
                </span>
              </div>
            ))}
          </Strip>
        </div>

        {/* Rows — the desktop's white card: border, radius, shadow, hairline
            dividers running the full width of the card. */}
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_18px_50px_-12px_rgba(74,46,22,0.30)]">
          <div className="grid" style={{ gridTemplateColumns: GRID }}>
            {rows.map((row, ri) => {
              // Row divider on BOTH the label and the value cell, with no gap
              // between them, so each row reads as one continuous line; the
              // value side also carries the column line (border-l), matching the
              // desktop table. Both sit on the static Strip wrapper, so they
              // don't slide with the values.
              const edge = ri < rows.length - 1 ? "border-b border-line" : "";
              return (
                <Fragment key={ri}>
                  <div className={`flex items-center px-4 py-3.5 text-[13px] font-semibold leading-snug text-cocoa ${edge}`}>
                    {row.label}
                  </div>
                  <Strip active={active} className={`border-l border-line ${edge}`}>
                    {row.cells.map((c, ci) => (
                      <div
                        key={ci}
                        className={`flex items-center justify-center break-words px-2 py-3 text-center ${
                          ci === 0 ? "bg-[#FCF2DD]" : ""
                        }`}
                      >
                        {c}
                      </div>
                    ))}
                  </Strip>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <SliderControls
        active={active}
        last={last}
        go={go}
        labels={columns.map((c) => c.label)}
        noun="option"
        className="mt-4"
      />
    </div>
  );
}
