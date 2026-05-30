import type { MechanismStep } from "@/types/metafields";
import Image from "next/image";

// Defaults are intentional Lorem ipsum placeholders. Per-product copy lives
// in beepaws.mechanism_steps + beepaws.education_note metafields; the intro,
// paradox, and steps headings are also overridable via props if a product
// needs different framing.
const DEFAULT_STEPS: MechanismStep[] = [
  {
    number: "1",
    title: "Lorem ipsum step one",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    number: "2",
    title: "Lorem ipsum step two",
    description:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    number: "3",
    title: "Lorem ipsum step three",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
];

// Default body for the "feels broken" callout. Set beepaws.education_note to
// override this with the product's actual first-use reassurance copy.
const DEFAULT_FEELS_BROKEN_NOTE =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.";

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
  // "Feels broken" callout — pulls from beepaws.education_note when set.
  // Heading is hard-coded brand copy; body is editor-overridable.
  feelsBrokenNote?: string | null;
  feelsBrokenHeading?: string;
}

export function Mechanism({
  steps,
  introEyebrow = "Lorem ipsum",
  introHeading = "Lorem ipsum dolor sit amet",
  introLead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  paradoxHeading = "Lorem ipsum subheading",
  paradoxParagraphs = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  ],
  paradoxPullQuote = "Lorem ipsum dolor sit amet, consectetur adipiscing elit — placeholder pull quote.",
  stepsHeading = "Lorem ipsum steps heading",
  stepsLead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  diagramImageUrl = null,
  feelsBrokenNote,
  feelsBrokenHeading = "Lorem ipsum — placeholder callout heading",
}: Props) {
  const data = steps && steps.length > 0 ? steps : DEFAULT_STEPS;
  const feelsBrokenBody = feelsBrokenNote?.trim() || DEFAULT_FEELS_BROKEN_NOTE;

  return (
    <section className="bg-toffee py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <span className="block text-center text-xs font-bold uppercase tracking-[0.14em] text-gold-deep mb-2.5">
          {introEyebrow}
        </span>
        <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
          {introHeading}
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-base text-brown">
          {introLead}
        </p>

        {/* Intro grid: diagram + body copy. Diagram bg flipped from honey-tint
            (now too close to toffee) to card-white so it still reads as a
            distinct framed block on the warm mid-tone section. */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-line bg-card md:min-h-[320px]">
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
            <h3 className="font-display mb-3 text-2xl font-semibold text-cocoa md:text-[30px]">
              {paradoxHeading}
            </h3>
            {paradoxParagraphs[0] && (
              <p className="mb-3 text-[15.5px] leading-relaxed text-brown">
                {paradoxParagraphs[0]}
              </p>
            )}
            {paradoxPullQuote && (
              <blockquote className="font-display my-5 border-l-[3px] border-cocoa pl-4 text-lg italic text-cocoa">
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

        {/* Steps. Cards flipped from honey-tint to card-white — honey-tint sat
            too close to the toffee section bg and washed out. White cards pop. */}
        <div className="mt-16">
          <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-2xl font-semibold leading-tight tracking-tight text-cocoa md:text-3xl">
            {stepsHeading}
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-base text-brown">
            {stepsLead}
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {data.map((step) => (
              <div
                key={step.number + step.title}
                className="rounded-2xl bg-card p-6 text-center shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)] md:p-7"
              >
                <div className="font-display text-3xl font-bold text-gold-deep md:text-[34px]">
                  {step.number}
                </div>
                <h3 className="font-display mb-2 mt-1.5 text-lg font-semibold text-cocoa">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-brown">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feels-broken callout — restructure plan §Task 3 (v2) — this is the
            page's single deliberate dark accent. Small cocoa inset with
            light text against the toffee section. One dark punch, not a slab. */}
        <div className="mt-12 grid items-center gap-7 rounded-2xl bg-cocoa p-8 md:mt-14 md:grid-cols-[auto_1fr] md:gap-10 md:p-10">
          <div className="mx-auto md:mx-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold bg-gold/15 text-5xl">
              🤫
            </div>
          </div>
          <div className="text-center md:text-left">
            <h3 className="font-display mb-2 text-2xl font-semibold text-cream md:text-[24px]">
              {feelsBrokenHeading}
            </h3>
            <p className="text-[15px] leading-relaxed text-cream/80">
              {feelsBrokenBody}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
