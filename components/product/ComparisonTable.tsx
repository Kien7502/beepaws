import { Check, X, PawPrint, Stethoscope, Wrench } from "lucide-react";

const ROWS = [
  { label: "Quiet Motor",      beepaws: true, vet: false, other: false },
  { label: "Safe at Home",     beepaws: true, vet: false, other: false },
  { label: "Stress-free",      beepaws: true, vet: false, other: false },
  { label: "All Coat Types",   beepaws: true, vet: true,  other: false },
  { label: "30-Day Guarantee", beepaws: true, vet: false, other: false },
  { label: "One-time Cost",    beepaws: true, vet: false, other: true  },
];

export function ComparisonTable() {
  return (
    <section className="bg-[var(--background)] py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-start md:gap-20">

          {/* Left — heading */}
          <div className="shrink-0 text-center md:w-2/5 md:text-left">
            <h2 className="mb-4 text-4xl font-black leading-tight tracking-tight text-[var(--color-foreground)] md:text-5xl">
              Why thousands of pet parents choose BeePaws
            </h2>
            <p className="mx-auto max-w-xs leading-relaxed text-[var(--color-accent)]/70 md:mx-0">
              See how BeePaws stacks up against a vet visit or cheap clippers — no contest.
            </p>
          </div>

          {/* Right — table */}
          <div className="w-full md:flex-1">

            {/* Column headers */}
            <div className="mb-4 grid grid-cols-4 items-end gap-2 text-center">
              <div />
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]">
                  <PawPrint size={20} className="text-white" />
                </div>
                <span className="text-xs font-extrabold text-[var(--color-foreground)]">BeePaws</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                  <Stethoscope size={20} className="text-[var(--color-accent)]" />
                </div>
                <span className="text-xs font-bold text-[var(--color-accent)]/60">Vet Visit</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                  <Wrench size={20} className="text-[var(--color-accent)]" />
                </div>
                <span className="text-xs font-bold text-[var(--color-accent)]/60">Other Tools</span>
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {ROWS.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-4 items-center overflow-hidden rounded-2xl bg-[var(--color-secondary)]/60"
                >
                  <div className="px-4 py-3.5 text-sm font-bold text-[var(--color-foreground)]">
                    {row.label}
                  </div>
                  <div className="flex items-center justify-center py-3.5 bg-[var(--color-accent)]">
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex items-center justify-center py-3.5">
                    {row.vet
                      ? <Check className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={3} />
                      : <X className="h-5 w-5 text-[var(--color-accent)]/30" strokeWidth={3} />}
                  </div>
                  <div className="flex items-center justify-center py-3.5">
                    {row.other
                      ? <Check className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={3} />
                      : <X className="h-5 w-5 text-[var(--color-accent)]/30" strokeWidth={3} />}
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
