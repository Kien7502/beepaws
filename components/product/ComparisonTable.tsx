import type { ComparisonRow } from "@/types/metafields";
import { Check, X, PawPrint, Stethoscope, Leaf } from "lucide-react";

// Lorem ipsum row labels — set beepaws.comparison_rows to override.
// The true/false check pattern stays representative so the table reads
// correctly while waiting for real copy.
const DEFAULT_ROWS: ComparisonRow[] = [
  { label: "Lorem ipsum feature 1", beepaws: true,  vet: true,  other: false },
  { label: "Lorem ipsum feature 2", beepaws: true,  vet: false, other: true  },
  { label: "Lorem ipsum feature 3", beepaws: true,  vet: false, other: true  },
  { label: "Lorem ipsum feature 4", beepaws: true,  vet: false, other: false },
  { label: "Lorem ipsum feature 5", beepaws: true,  vet: true,  other: false },
  { label: "Lorem ipsum feature 6", beepaws: true,  vet: true,  other: false },
];

interface Props {
  rows?: ComparisonRow[] | null;
  eyebrow?: string;
  heading?: string;
  lead?: string;
  // Column headers — brand-stable, default to the reference copy. Editable as
  // props if a product needs different competitor framing.
  columnUs?: string;
  columnVet?: string;
  columnOther?: string;
}

export function ComparisonTable({
  rows,
  eyebrow = "Lorem ipsum",
  heading = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  lead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do.",
  columnUs = "BeePaws",
  columnVet = "Vet Cleaning",
  columnOther = "Chews & Additives",
}: Props) {
  const data = rows && rows.length > 0 ? rows : DEFAULT_ROWS;

  // Render a comparison cell. When text is present (e.g. the cost row) it
  // renders in place of the ✓/✕ icon; the boolean still drives the color.
  function cell(active: boolean, text?: string | null) {
    if (text) {
      return (
        <span className={`text-sm font-bold ${active ? "text-clay" : "text-rose-soft"}`}>
          {text}
        </span>
      );
    }
    return active ? (
      <Check className="h-5 w-5 text-clay" strokeWidth={3} />
    ) : (
      <X className="h-5 w-5 text-rose-soft" strokeWidth={3} />
    );
  }

  // Warm Honey: white section, heading on the left, table on the right. "Us"
  // (BeePaws) column header is a cocoa badge; competitor columns use cream
  // badges. Check icons in clay, X in rose-soft. Display font on the heading.
  return (
    <section className="bg-card py-14 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-start md:gap-12">

          {/* Left — heading */}
          <div className="shrink-0 text-center md:w-1/3 md:text-left">
            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-gold-deep mb-2.5">
              {eyebrow}
            </span>
            <h2 className="font-display mb-4 text-4xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
              {heading}
            </h2>
            <p className="mx-auto max-w-xs leading-relaxed text-brown md:mx-0">
              {lead}
            </p>
          </div>

          {/* Right — table */}
          <div className="w-full md:flex-1">

            {/* Column header badges — sit OUTSIDE the table card, above it.
                Grid template matches the rows below so badges line up over
                their columns (wider first column for the row labels). */}
            <div className="mb-4 grid grid-cols-[1.5fr_1fr_1fr_1fr] items-end gap-2 text-center">
              <div />
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cocoa">
                  <PawPrint size={20} className="text-gold" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-cocoa">{columnUs}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream">
                  <Stethoscope size={20} className="text-brown" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brown">{columnVet}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream">
                  <Leaf size={20} className="text-brown" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brown">{columnOther}</span>
              </div>
            </div>

            {/* Rows — white card with line dividers */}
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_18px_50px_-12px_rgba(74,46,22,0.30)]">
              {data.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] items-stretch ${i < data.length - 1 ? "border-b border-line" : ""}`}
                >
                  <div className="flex items-center px-5 py-4 text-sm font-semibold text-cocoa">
                    {row.label}
                  </div>
                  <div className="flex items-center justify-center py-3.5 bg-[#FCF2DD]">
                    {cell(row.beepaws, row.beepawsText)}
                  </div>
                  <div className="flex items-center justify-center py-3.5">
                    {cell(row.vet, row.vetText)}
                  </div>
                  <div className="flex items-center justify-center py-3.5">
                    {cell(row.other, row.otherText)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
