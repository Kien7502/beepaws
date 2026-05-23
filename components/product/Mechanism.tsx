import type { MechanismStep } from "@/types/metafields";
import Image from "next/image";

// Plan §Phase 4: "the reason nothing else worked" — biology explanation
// followed by 3-step "how it works" grid. Device-only section: the product
// page renders this conditionally based on Shopify product tag "device".
const DEFAULT_STEPS: MechanismStep[] = [
  {
    number: "1",
    title: "Micro-cavitation, not scraping",
    description:
      "The tip oscillates 25,000–45,000× per second, creating tiny bubbles that implode against the tartar and shatter it — with zero scraping force.",
  },
  {
    number: "2",
    title: "It only \"wakes up\" on a tooth",
    description:
      "Completely silent and still in the air. It activates the instant it touches a hard surface — so there's nothing to frighten your dog.",
  },
  {
    number: "3",
    title: "5–10 seconds per tooth",
    description:
      "A calm bonding ritual on the couch, not a medical procedure. The hardened plaque simply chips away as you go.",
  },
];

interface Props {
  steps?: MechanismStep[] | null;
  // Optional intro overrides; defaults keep the dental-scaler narrative.
  // Image is intentionally optional — when null, the visual placeholder is
  // rendered so the layout reads correctly before real photography lands.
  introEyebrow?: string;
  introHeading?: string;
  introLead?: string;
  paradoxHeading?: string;
  paradoxParagraphs?: string[];
  paradoxPullQuote?: string;
  stepsHeading?: string;
  stepsLead?: string;
  diagramImageUrl?: string | null;
}

export function Mechanism({
  steps,
  introEyebrow = "The reason nothing else worked",
  introHeading = "It was never about brushing harder",
  introLead = "There's a real, biological reason the chews and additives never touched the hard stuff.",
  paradoxHeading = "The Canine Saliva Paradox",
  paradoxParagraphs = [
    "Unlike yours, your dog's saliva lacks the enzyme that breaks down the starches in modern kibble and \"dental\" treats. Those starches cement onto the tooth as hardened tartar.",
    "That's why you can do everything right and still watch the brown crust spread. You needed a different mechanism — not more effort.",
  ],
  paradoxPullQuote = "It's not laziness. Brushing, chewing and water additives are mathematically incapable of removing tartar that's already cemented.",
  stepsHeading = "How it actually removes hardened tartar",
  stepsLead = "Piezoelectric ultrasonic cavitation — the vet's own method, sized for your lap.",
  diagramImageUrl = null,
}: Props) {
  const data = steps && steps.length > 0 ? steps : DEFAULT_STEPS;

  return (
    <section className="bg-paper py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <span className="block text-center text-xs font-extrabold uppercase tracking-[0.14em] text-gold-deep mb-2.5">
          {introEyebrow}
        </span>
        <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight text-cocoa md:text-[33px]">
          {introHeading}
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-base text-brown">
          {introLead}
        </p>

        {/* Intro grid: diagram + body copy */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-line bg-honey-tint md:min-h-[320px]">
            {diagramImageUrl ? (
              <Image
                src={diagramImageUrl}
                alt="Tooth cross-section showing visible crust above gumline and hidden tartar below"
                fill
                className="object-cover"
                sizes="(max-width: 880px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 text-center text-xs font-bold uppercase tracking-wider text-brown">
                [ DIAGRAM — tooth cross-section: visible crust above gumline, hidden tartar below ]
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display mb-3 text-2xl font-bold text-cocoa md:text-[30px]">
              {paradoxHeading}
            </h3>
            {paradoxParagraphs[0] && (
              <p className="mb-3 text-[15.5px] leading-relaxed text-brown">
                {paradoxParagraphs[0]}
              </p>
            )}
            {paradoxPullQuote && (
              <blockquote className="font-display my-5 border-l-[3px] border-gold pl-4 text-lg italic text-clay">
                &ldquo;{paradoxPullQuote}&rdquo;
              </blockquote>
            )}
            {paradoxParagraphs.slice(1).map((para, i) => (
              <p key={i} className="mb-3 text-[15.5px] leading-relaxed text-brown">
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="mt-16">
          <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-2xl font-bold leading-tight tracking-tight text-cocoa md:text-3xl">
            {stepsHeading}
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-base text-brown">
            {stepsLead}
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {data.map((step) => (
              <div
                key={step.number + step.title}
                className="rounded-2xl bg-honey-tint p-6 text-center md:p-7"
              >
                <div className="font-display text-3xl font-bold text-gold-deep md:text-[34px]">
                  {step.number}
                </div>
                <h3 className="font-display mb-2 mt-1.5 text-lg font-bold text-cocoa">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-brown">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
