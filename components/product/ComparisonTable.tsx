import type { ComparisonData, ComparisonColumn } from "@/types/metafields";
import { Check, X, PawPrint } from "lucide-react";
import { contentIcon } from "@/lib/content-icons";

// Mobile carousel geometry. The rail holds full-sentence row labels, so it needs
// real width; scroll-padding must equal it exactly or a snapped column lands
// underneath the frozen labels.
const RAIL_W = "10.5rem";
const COL_W = "8.5rem";

const DEFAULT_COLUMNS: ComparisonColumn[] = [
  { label: "BeePaws", icon: "PawPrint" },
  { label: "Vet Cleaning", icon: "Stethoscope" },
  { label: "Chews & Additives", icon: "Leaf" },
];

// Lorem ipsum placeholders — set beepaws.comparison_rows to override. The check
// pattern stays representative so the table reads correctly before real copy.
const DEFAULT_DATA: ComparisonData = {
  columns: DEFAULT_COLUMNS,
  rows: [
    { label: "Lorem ipsum feature 1", cells: [{ on: true }, { on: true }, { on: false }] },
    { label: "Lorem ipsum feature 2", cells: [{ on: true }, { on: false }, { on: true }] },
    { label: "Lorem ipsum feature 3", cells: [{ on: true }, { on: false }, { on: true }] },
    { label: "Lorem ipsum feature 4", cells: [{ on: true }, { on: false }, { on: false }] },
    { label: "Lorem ipsum feature 5", cells: [{ on: true }, { on: true }, { on: false }] },
    { label: "Lorem ipsum feature 6", cells: [{ on: true }, { on: true }, { on: false }] },
  ],
};

// Accept the new { columns, rows } object, the legacy row array, or null, and
// return a normalized ComparisonData (mirrors beepaws-admin's normalizeComparison).
function normalizeComparison(value: unknown): ComparisonData {
  if (value && typeof value === "object" && !Array.isArray(value) && Array.isArray((value as { rows?: unknown }).rows)) {
    const v = value as { columns?: ComparisonColumn[]; rows?: { label?: string; cells?: { on?: boolean; text?: string | null }[] }[] };
    const columns = Array.isArray(v.columns) && v.columns.length ? v.columns : DEFAULT_COLUMNS;
    return {
      columns,
      rows: (v.rows ?? []).map((r) => ({
        label: r.label ?? "",
        cells: columns.map((_, i) => ({ on: !!r.cells?.[i]?.on, text: r.cells?.[i]?.text ?? null })),
      })),
    };
  }
  if (Array.isArray(value)) {
    return {
      columns: DEFAULT_COLUMNS,
      rows: (value as Record<string, unknown>[]).map((r) => ({
        label: (r.label as string) ?? "",
        cells: [
          { on: !!r.beepaws, text: (r.beepawsText as string | null) ?? null },
          { on: !!r.vet, text: (r.vetText as string | null) ?? null },
          { on: !!r.other, text: (r.otherText as string | null) ?? null },
        ],
      })),
    };
  }
  return { columns: DEFAULT_COLUMNS, rows: [] };
}

interface Props {
  // Raw beepaws.comparison_rows value (object, legacy array, or null).
  rows?: unknown;
  eyebrow?: string;
  heading?: string;
  lead?: string;
}

export function ComparisonTable({
  rows,
  heading = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  lead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do.",
}: Props) {
  const norm = normalizeComparison(rows);
  const data = norm.rows.length ? norm : DEFAULT_DATA;
  const { columns, rows: dataRows } = data;
  // First column (index 0) is the "us" column — highlighted like the reference.
  const gridCols = `1.5fr repeat(${columns.length}, 1fr)`;

  // Render a comparison cell. When text is present (e.g. the cost row) it
  // renders in place of the ✓/✕ icon; the boolean still drives the color.
  function cell(active: boolean, text?: string | null) {
    if (text) {
      return <span className={`text-sm font-bold ${active ? "text-clay" : "text-rose-soft"}`}>{text}</span>;
    }
    return active ? (
      <Check className="h-5 w-5 text-clay" strokeWidth={3} />
    ) : (
      <X className="h-5 w-5 text-rose-soft" strokeWidth={3} />
    );
  }

  // Warm Honey: white section, heading on the left, table on the right. The first
  // column header is a cocoa badge; the rest use cream badges. Check icons in
  // clay, X in rose-soft. Display font on the heading.
  return (
    <section className="ds-reveal-in bg-card py-14 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-start md:gap-12">

          {/* Left — heading */}
          <div className="shrink-0 text-center md:w-1/3 md:text-left">
            <h2 className="font-display mb-4 text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
              {heading}
            </h2>
            <p className="mx-auto max-w-xs leading-relaxed text-brown md:mx-0">
              {lead}
            </p>
          </div>

          {/* Right — table */}
          <div className="relative w-full md:flex-1">

            {/* MOBILE — the row labels stay FROZEN on the left and only the option
                columns slide, one per swipe. (First attempt put a whole column on
                each slide, labels repeated inside; you lose your place because
                nothing is anchored.) Before that it forced the desktop grid to
                min-w-[540px] and scrolled sideways, cutting cells in half.

                It's a real <table> on purpose: `position: sticky` on a cell is the
                one dependable way to freeze a column — as a grid item the same
                rule does nothing, because a grid item's containing block is its
                own grid area, so there's no room to stick. A table also matches
                label heights to value heights for free, which two side-by-side
                containers can't do without fixed row heights. Scroll-snap does the
                carousel; no JS (this is a server component), no library. */}
            <div
              className="-mb-6 snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-6 md:hidden"
              style={{ scrollPaddingLeft: RAIL_W }}
            >
              <table className="border-separate border-spacing-0" style={{ width: "max-content" }}>
                <caption className="caption-top pb-2 text-left text-xs font-semibold text-brown/70">
                  Swipe to compare — the rows stay put.
                </caption>
                <thead>
                  <tr>
                    {/* Corner: empty, but it has to be sticky too or the columns
                        slide over the gap above the labels. */}
                    <th className="sticky left-0 z-20 bg-card" style={{ width: RAIL_W }} />
                    {columns.map((col, i) => {
                      const Icon = contentIcon(col.icon, PawPrint);
                      const isUs = i === 0;
                      return (
                        <th
                          key={i}
                          scope="col"
                          className="snap-start border-b border-line px-2 pb-3 align-bottom"
                          style={{ width: COL_W }}
                        >
                          <span className="flex flex-col items-center gap-1.5">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isUs ? "bg-cocoa" : "bg-cream"}`}>
                              <Icon size={18} className={isUs ? "text-gold" : "text-brown"} />
                            </span>
                            <span className={`text-[11px] uppercase leading-tight tracking-wider ${isUs ? "font-extrabold text-cocoa" : "font-bold text-brown"}`}>
                              {col.label}
                            </span>
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, ri) => {
                    const last = ri === dataRows.length - 1;
                    return (
                      <tr key={ri}>
                        <th
                          scope="row"
                          // The frozen rail. Solid background + a soft right edge so
                          // the scrolling columns read as passing UNDER it.
                          className={`sticky left-0 z-10 bg-card py-3 pr-3 text-left text-[13px] font-semibold leading-snug text-cocoa shadow-[7px_0_9px_-7px_rgba(74,46,22,0.22)] ${
                            last ? "" : "border-b border-line"
                          }`}
                          style={{ width: RAIL_W }}
                        >
                          {row.label}
                        </th>
                        {columns.map((_, ci) => {
                          const c = row.cells[ci] ?? { on: false, text: null };
                          return (
                            <td
                              key={ci}
                              className={`snap-start px-2 py-3 text-center align-middle ${ci === 0 ? "bg-[#FCF2DD]" : ""} ${
                                last ? "" : "border-b border-line"
                              }`}
                            >
                              <span className="inline-flex justify-center">{cell(c.on, c.text)}</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* DESKTOP — the real side-by-side table, where the comparison works. */}
            <div className="hidden md:block">

            {/* Column header badges — sit above the table card, aligned over their
                columns (wider first column for the row labels). */}
            <div className="mb-4 grid items-end gap-2 text-center" style={{ gridTemplateColumns: gridCols }}>
              <div />
              {columns.map((col, i) => {
                const Icon = contentIcon(col.icon, PawPrint);
                const isUs = i === 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isUs ? "bg-cocoa" : "bg-cream"}`}>
                      <Icon size={20} className={isUs ? "text-gold" : "text-brown"} />
                    </div>
                    <span className={`text-xs uppercase tracking-wider ${isUs ? "font-extrabold text-cocoa" : "font-bold text-brown"}`}>
                      {col.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows — white card with line dividers */}
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_18px_50px_-12px_rgba(74,46,22,0.30)]">
              {dataRows.map((row, i) => (
                <div
                  key={i}
                  className={`grid items-stretch ${i < dataRows.length - 1 ? "border-b border-line" : ""}`}
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className="flex items-center px-5 py-4 text-sm font-semibold text-cocoa">
                    {row.label}
                  </div>
                  {columns.map((_, ci) => {
                    const c = row.cells[ci] ?? { on: false, text: null };
                    return (
                      <div key={ci} className={`flex items-center justify-center py-3.5 ${ci === 0 ? "bg-[#FCF2DD]" : ""}`}>
                        {cell(c.on, c.text)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
