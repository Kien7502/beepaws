import type { UseCaseCard } from "@/types/metafields";

const DEFAULT_USE_CASES: UseCaseCard[] = [
  {
    emoji: "😴",
    label: "Stress-free",
    title: "For anxious dogs",
    description: "Silent ultrasonic frequency — no scary whirring or vibration. Your dog stays calm from start to finish.",
    from: "#f5a800",
    to: "#fff3dc",
  },
  {
    emoji: "🦷",
    label: "All sizes",
    title: "Any breed, any age",
    description: "From tiny Chihuahuas to large Labradors, BeePaws safely breaks down tartar on every dog.",
    from: "#8b5e2a",
    to: "#fff3dc",
  },
  {
    emoji: "🏠",
    label: "At home",
    title: "Skip the vet bill",
    description: "Professional-grade tartar removal at home. Save up to $1,400 on anesthesia cleanings — no appointment needed.",
    from: "#3d2400",
    to: "#fff3dc",
  },
];

interface Props {
  cards?: UseCaseCard[] | null;
}

export function UseCaseCards({ cards }: Props) {
  const data = cards && cards.length > 0 ? cards : DEFAULT_USE_CASES;

  return (
    <section className="bg-[#FFE8B0] py-14 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="mb-2 text-center text-3xl font-black tracking-tight text-[var(--color-foreground)] md:text-4xl">
          Made for every kind of pet parent
        </h2>
        <p className="mb-10 text-center text-base text-[var(--color-accent)]/70">
          Whether your dog is anxious, big, or just overdue for a cleaning.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {data.map((c) => (
            <div
              key={c.title}
              className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--background)] shadow-[var(--elev-shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--elev-shadow-card-hover)]"
            >
              {/* Gradient emoji area */}
              <div
                className="relative flex h-44 items-center justify-center text-6xl"
                style={{ background: `linear-gradient(135deg, ${c.from}25 0%, ${c.to} 100%)` }}
              >
                <span
                  className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
                  style={{ background: c.from }}
                >
                  {c.label}
                </span>
                <span className="drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {c.emoji}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2 p-6">
                <div className="h-1 w-8 rounded-full" style={{ background: c.from }} />
                <h3 className="text-lg font-extrabold text-[var(--color-foreground)]">{c.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-accent)]/80">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
