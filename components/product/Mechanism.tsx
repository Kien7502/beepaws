import type { MechanismStep } from "@/types/metafields";
import { VolumeX } from "lucide-react";
import Image from "next/image";
import { withBold, withAccent } from "@/lib/inline-format";
import { CardSlider } from "@/components/product/Slider";

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

// Default body for the "feels broken" callout. Set the mechanism_intro
// metafield's feelsBrokenBody to override (split from education_note
// 2026-07-17 — that field feeds only the buy-column reassurance now).
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
  /** The paradox copy as ONE string; a blank line starts a new paragraph.
   *  Replaces the old paragraph1 / pullQuote / paragraph2 slots — three fixed
   *  boxes where the middle one was labelled "pull quote" but rendered as plain
   *  body copy between the other two. ProductPageView still assembles those for
   *  products whose content hasn't been re-saved. */
  paradoxBody?: string;
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
  introHeading = "Lorem ipsum dolor sit amet",
  introLead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  paradoxHeading = "Lorem ipsum subheading",
  paradoxBody = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  stepsHeading = "Lorem ipsum steps heading",
  stepsLead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  diagramImageUrl = null,
  feelsBrokenNote,
  feelsBrokenHeading = "Lorem ipsum — placeholder callout heading",
}: Props) {
  const data = steps && steps.length > 0 ? steps : DEFAULT_STEPS;
  // A blank line starts a new paragraph — the same convention the editor's field
  // label states. Trailing/leading whitespace and stray extra blank lines are
  // tolerated so authoring can't produce an empty <p>.
  const paragraphs = paradoxBody
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean);
  const feelsBrokenBody = feelsBrokenNote?.trim() || DEFAULT_FEELS_BROKEN_NOTE;

  return (
    <section className="ds-reveal-in bg-toffee py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
          {withAccent(introHeading)}
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-base text-brown">
          {introLead}
        </p>

        {/* Intro grid: diagram + body copy. Diagram bg flipped from honey-tint
            (now too close to toffee) to card-white so it still reads as a
            distinct framed block on the warm mid-tone section. */}
        <div className="rounded-2xl bg-card p-6 shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)] md:p-8">
        <div className="grid items-center gap-10 md:grid-cols-[420px_minmax(0,1fr)] md:gap-10">
          {/* Diagram left (its original side), copy right. The first track is
              EXACTLY the figure's width (420px), not a fraction — a 1fr track
              left the capped figure centred inside a wider column, so dead
              gutter pushed the copy away from it.

              THE CARD IS BACK (2026-09-21, owner: "it looked good"). It was
              tried 2026-09-19 and dropped the next day because it read clunky -
              but that card wrapped 436 characters against a 340px figure and was
              mostly empty. It now holds 836 characters against a 420px figure,
              and it wears the STEP CARDS' treatment (soft shadow, no border)
              instead of the original heavy bordered one, so the section reads as
              one family. On phones it is what gives the copy a container at all:
              the paragraphs used to run bare down the toffee band.

              WIDTH: the card fills the section container, like the steps and the
              callout. Its padding also pulls the copy measure in to ~78
              characters a line, which is where body text wants to be. */}
          <div
            // Square — 4:3 cropped the diagram's own labels (SALIVA at the top,
            // HUMAN/DOG at the bottom sit close to its edges). Height is controlled
            // by CAPPING the slot (max-w) instead of cropping, so the figure stays
            // fully intact without towering over the copy beside it.
            // No border/background of its own: it sits inside the white card,
            // and the diagram's artwork already carries a cream field.
            className={`relative mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl ${
              diagramImageUrl ? "aspect-square" : "min-h-[260px] md:min-h-[320px] bg-honey-tint"
            }`}
          >
            {diagramImageUrl ? (
              <Image
                src={diagramImageUrl}
                alt="Tooth cross-section showing visible crust above gumline and hidden tartar below"
                fill
                className="object-cover"
                sizes="(max-width: 880px) 100vw, 340px"
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
            {/* Justified (Word-style flush edges). hyphens-auto rides along on
                purpose: justifying a ~520px column WITHOUT hyphenation stretches
                word gaps into visible white "rivers". <html lang="en"> is set, so
                the browser can actually hyphenate. */}
            {paragraphs.map((para, i) => (
              <p key={i} className="mb-3 text-justify hyphens-auto text-[15.5px] leading-relaxed text-brown">
                {withBold(para)}
              </p>
            ))}
          </div>
        </div>
        </div>

        {/* Steps. Cards flipped from honey-tint to card-white - honey-tint sat
            too close to the toffee section bg and washed out. White cards pop.

            Shape restored 2026-09-20: the border + flattening came in to match
            the intro card (b374139, b6f4373) and outlived it, so the soft shadow
            is back and the type is at its original size. `h-full` STAYS - it
            keeps the three equal inside the slider, which was never a card-era
            change. Width matches the intro row: both fill the container. */}
        <div className="mt-16">
          <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-2xl font-semibold leading-tight tracking-tight text-cocoa md:text-3xl">
            {stepsHeading}
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-base text-brown">
            {stepsLead}
          </p>
          {/* Phones: one step at a time; md+: the same three-column grid as before. */}
          <CardSlider
            gap="1.25rem"
            labels={data.map((step) => `step ${step.number}`)}
            slides={data.map((step) => (
              <div
                key={step.number + step.title}
                className="h-full rounded-2xl bg-card p-6 text-center shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)] md:p-7"
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
          />
        </div>

        {/* Feels-broken callout — restructure plan §Task 3 (v2) — this is the
            page's single deliberate dark accent. Small cocoa inset with
            light text against the toffee section. One dark punch, not a slab. */}
        <div className="mt-12 grid items-center gap-7 rounded-2xl bg-cocoa p-8 md:mt-14 md:grid-cols-[auto_1fr] md:gap-10 md:p-10">
          <div className="mx-auto md:mx-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold bg-gold/15">
              <VolumeX className="h-11 w-11 text-amber" aria-hidden />
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
