import type { PainPoint } from "@/types/metafields";

// Plan §Phase 4: agitates the three real problems pet parents are hitting
// before the buy moment. Defaults baked from the device reference; editors
// override per-product via beepaws.pain_points metafield.
const DEFAULT_PAIN_POINTS: PainPoint[] = [
  {
    number: "01",
    title: "The breath you can't ignore",
    description:
      "It's not \"doggy breath\" anymore. You turn your face away when she yawns near you in bed — and you feel terrible for it.",
  },
  {
    number: "02",
    title: "The $1,400 sticker shock",
    description:
      "The vet quote landed somewhere between $500 and $1,400+ — bloodwork, fluids, per-tooth extractions stacked on top.",
  },
  {
    number: "03",
    title: "The fear that won't quiet down",
    description:
      "A \"routine\" cleaning means general anesthesia. For a small breed or a senior dog, that's a risk you keep replaying at 2 a.m.",
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
  eyebrow = "If this sounds like you",
  heading = "You smelled it first. Then you saw the brown crust. Then you saw the bill.",
  lead = "Three problems hit at once — and most pet parents feel stuck between all of them.",
}: Props) {
  const data = points && points.length > 0 ? points : DEFAULT_PAIN_POINTS;

  return (
    <section className="bg-cream py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <span className="block text-center text-xs font-extrabold uppercase tracking-[0.14em] text-gold-deep mb-2.5">
          {eyebrow}
        </span>
        <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight text-cocoa md:text-[33px]">
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
              <h3 className="font-display text-lg font-bold text-cocoa md:text-[19px] mb-1.5">
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
