const CASES = [
  {
    emoji: "🐾",
    label: "Anxiety-free",
    title: "For anxious pets",
    description: "Gentle, whisper-quiet motor means no scary buzzing. Your fur baby stays calm from start to finish.",
    from: "#f5a800",
    to: "#fff3dc",
  },
  {
    emoji: "🐩",
    label: "All coats",
    title: "For long-haired breeds",
    description: "Glides through thick coats and tangles without pulling or yanking — no matted fur left behind.",
    from: "#8b5e2a",
    to: "#fff3dc",
  },
  {
    emoji: "🏠",
    label: "At home",
    title: "At-home convenience",
    description: "Skip the $80 groomer visit. Get professional results in 15 minutes from your own couch.",
    from: "#3d2400",
    to: "#fff3dc",
  },
];

export function UseCaseCards() {
  return (
    <section className="bg-[var(--color-surface)] py-14 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="mb-2 text-center text-3xl font-black tracking-tight text-[var(--color-foreground)] md:text-4xl">
          Made for every kind of pet parent
        </h2>
        <p className="mb-10 text-center text-base text-[var(--color-accent)]/70">
          Whether your pet is anxious, fluffy, or just overdue for a trim.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {CASES.map((c) => (
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
