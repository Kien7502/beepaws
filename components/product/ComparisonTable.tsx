import type { ComparisonRow } from "@/types/metafields";
import { Check, X, PawPrint, Stethoscope, Leaf } from "lucide-react";

const DEFAULT_ROWS: ComparisonRow[] = [
  { label: "Removes hard tartar",  beepaws: true,  vet: true,  other: false },
  { label: "No anesthesia risk",   beepaws: true,  vet: false, other: true  },
  { label: "Safe at home",         beepaws: true,  vet: false, other: true  },
  { label: "Silent operation",     beepaws: true,  vet: false, other: true  },
  { label: "One-time cost",        beepaws: true,  vet: false, other: false },
  { label: "30-day guarantee",     beepaws: true,  vet: false, other: false },
];

interface Props {
  rows?: ComparisonRow[] | null;
}

export function ComparisonTable({ rows }: Props) {
  const data = rows && rows.length > 0 ? rows : DEFAULT_ROWS;

  // Warm Honey: honey-tint section bg with a white card-style table. "Us"
  // column header uses cocoa bg (per reference). Check icons in clay, X in
  // rose-soft. Display font on the heading.
  return (
    <section className="bg-honey-tint py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-start md:gap-20">

          {/* Left — heading */}
          <div className="shrink-0 text-center md:w-2/5 md:text-left">
            <h2 className="font-display mb-4 text-4xl font-bold leading-tight tracking-tight text-cocoa md:text-5xl">
              Why thousands of pet parents choose BeePaws
            </h2>
            <p className="mx-auto max-w-xs leading-relaxed text-brown md:mx-0">
              See how BeePaws stacks up against a $1,400 vet cleaning or those useless Greenies — no contest.
            </p>
          </div>

          {/* Right — table */}
          <div className="w-full md:flex-1">

            {/* Column headers */}
            <div className="mb-4 grid grid-cols-4 items-end gap-2 text-center">
              <div />
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cocoa">
                  <PawPrint size={20} className="text-gold" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-cocoa">BeePaws</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream">
                  <Stethoscope size={20} className="text-brown" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brown">Vet Visit</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream">
                  <Leaf size={20} className="text-brown" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brown">Dental Chews</span>
              </div>
            </div>

            {/* Rows — white card with line dividers */}
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_8px_24px_-12px_rgba(74,46,22,0.18)]">
              {data.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-4 items-center ${i < data.length - 1 ? "border-b border-line" : ""}`}
                >
                  <div className="px-4 py-3.5 text-sm font-bold text-cocoa">
                    {row.label}
                  </div>
                  <div className="flex items-center justify-center py-3.5 bg-[#FCF2DD]">
                    {row.beepaws
                      ? <Check className="h-5 w-5 text-clay" strokeWidth={3} />
                      : <X className="h-5 w-5 text-rose-soft" strokeWidth={3} />}
                  </div>
                  <div className="flex items-center justify-center py-3.5">
                    {row.vet
                      ? <Check className="h-5 w-5 text-clay" strokeWidth={3} />
                      : <X className="h-5 w-5 text-rose-soft" strokeWidth={3} />}
                  </div>
                  <div className="flex items-center justify-center py-3.5">
                    {row.other
                      ? <Check className="h-5 w-5 text-clay" strokeWidth={3} />
                      : <X className="h-5 w-5 text-rose-soft" strokeWidth={3} />}
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
