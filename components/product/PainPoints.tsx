import type { PainPoint } from "@/types/metafields";

// Defaults are intentional Lorem ipsum placeholders so an unedited product
// reads as unedited at a glance. Per-product copy lives in the
// beepaws.pain_points metafield (+ optional eyebrow/heading/lead override
// props if a product needs more than per-item variation).
const DEFAULT_PAIN_POINTS: PainPoint[] = [
  {
    number: "01",
    title: "Lorem ipsum #1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    number: "02",
    title: "Lorem ipsum #2",
    description:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    number: "03",
    title: "Lorem ipsum #3",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
];

interface Props {
  points?: PainPoint[] | null;
  // Optional eyebrow/heading/lead overrides — Phase 5 copy sweep can move
  // these into metafields if editors need per-product variation.
  eyebrow?: string;
  heading?: string;
  lead?: string;
}

export function PainPoints({
  points,
  heading = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  lead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
}: Props) {
  const data = points && points.length > 0 ? points : DEFAULT_PAIN_POINTS;

  return (
    // bg-cream (not paper): the hero band above is paper, and same-paper
    // drift made the buy area and the story read as one unseparated blob.
    <section className="ds-reveal-in bg-cream py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
          {heading}
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-base text-brown">
          {lead}
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          {data.map((p) => (
            <div
              key={p.number + p.title}
              className="rounded-2xl border border-line bg-card p-6 md:p-7 shadow-[0_4px_20px_-10px_rgba(74,46,22,0.08)]"
            >
              <div className="font-display mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-honey-tint text-[15px] font-bold text-gold-deep">
                {p.number}
              </div>
              <h3 className="font-display text-lg font-semibold text-cocoa md:text-[19px] mb-1.5">
                {p.title}
              </h3>
              <p className="text-[14.5px] leading-relaxed text-brown">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
