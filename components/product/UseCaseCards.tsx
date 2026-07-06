import Image from "next/image";
import type { UseCaseCard } from "@/types/metafields";

// Lorem ipsum placeholders — set the beepaws.use_cases metafield to override.
// Per-card emoji + gradient colors stay set so the layout reads correctly.
const DEFAULT_USE_CASES: UseCaseCard[] = [
  {
    emoji: "🟡",
    label: "Placeholder",
    title: "Lorem ipsum one",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    from: "#f5a800",
    to: "#fff3dc",
  },
  {
    emoji: "🟡",
    label: "Placeholder",
    title: "Lorem ipsum two",
    description: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    from: "#8b5e2a",
    to: "#fff3dc",
  },
  {
    emoji: "🟡",
    label: "Placeholder",
    title: "Lorem ipsum three",
    description: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    from: "#3d2400",
    to: "#fff3dc",
  },
];

interface Props {
  cards?: UseCaseCard[] | null;
  eyebrow?: string;
  heading?: string;
  lead?: string;
}

export function UseCaseCards({
  cards,
  heading = "Lorem ipsum dolor sit amet, consectetur adipiscing.",
  lead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
}: Props) {
  const data = cards && cards.length > 0 ? cards : DEFAULT_USE_CASES;

  // Warm Honey: cream section bg — sits between the sand UGC band and the
  // white comparison band after the 2026-07-06 narrative reorder, and cream
  // keeps the adjacent-bands-differ rule intact. White cards w/ hairline.
  // Per-card accent colors (c.from / c.to) still drive the gradient header
  // and bookmark accent — the metafield contract is preserved so editors
  // can keep authoring colors. Headings use the display serif.
  return (
    <section className="ds-reveal-in bg-cream py-14 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <h2 className="font-display mb-2 text-center text-3xl font-semibold tracking-tight text-cocoa md:text-4xl">
          {heading}
        </h2>
        <p className="mb-10 text-center text-base text-brown">
          {lead}
        </p>

        {/* md, not sm: three columns at 640px are ~200px each — too narrow for
            the image header + copy. Cards stack full-width until tablet. */}
        <div className="grid gap-6 md:grid-cols-3">
          {data.map((c) => (
            <div
              key={c.title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-[0_14px_40px_-16px_rgba(74,46,22,0.20)]"
            >
              {/* Card header — a per-card image when set (beepaws.use_cases[].image),
                  otherwise the emoji on the per-card gradient. The label badge sits
                  on top of either. */}
              <div
                className="relative flex h-44 items-center justify-center overflow-hidden text-6xl"
                style={{ background: `linear-gradient(135deg, ${c.from}25 0%, ${c.to} 100%)` }}
              >
                <span
                  className="absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
                  style={{ background: c.from }}
                >
                  {c.label}
                </span>
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <span className="drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                    {c.emoji}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2 p-6">
                <div className="h-1 w-8 rounded-full" style={{ background: c.from }} />
                <h3 className="font-display text-xl font-semibold text-cocoa">{c.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-brown">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
