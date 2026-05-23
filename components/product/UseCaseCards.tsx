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

  // Warm Honey: honey-tint section bg, white cards with hairline border.
  // Per-card accent colors (c.from / c.to) still drive the gradient header
  // and bookmark accent — the metafield contract is preserved so editors
  // can keep authoring colors. Headings use the display serif.
  return (
    <section className="bg-honey-tint py-14 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <span className="block text-center text-xs font-extrabold uppercase tracking-[0.14em] text-gold-deep mb-2">
          Who it's for
        </span>
        <h2 className="font-display mb-2 text-center text-3xl font-bold tracking-tight text-cocoa md:text-4xl">
          Made for every kind of pet parent
        </h2>
        <p className="mb-10 text-center text-base text-brown">
          Whether your dog is anxious, big, or just overdue for a cleaning.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {data.map((c) => (
            <div
              key={c.title}
              className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_-16px_rgba(74,46,22,0.20)]"
            >
              {/* Gradient emoji area — uses per-card metafield colors */}
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
                <h3 className="font-display text-xl font-bold text-cocoa">{c.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-brown">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
