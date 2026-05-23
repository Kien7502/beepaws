// Plan §Phase 4: addresses the #1 refund driver — "I think it's broken" —
// because the ultrasonic scaler is silent until tooth contact. This is the
// dedicated post-purchase reassurance block; the buy-button area already
// gets a smaller education_note rendered by VariantSelector.
//
// Device-only: gated at the product page via a Shopify product tag check.
// Renders the existing beepaws.education_note metafield if set, otherwise a
// strong default that matches the reference template copy.

interface Props {
  // Pulled from beepaws.education_note (already plumbed through the page).
  // When null, defaults to the dental-scaler copy.
  note?: string | null;
  heading?: string;
}

const DEFAULT_NOTE =
  "When you switch it on, you won't hear it and you won't feel it vibrate. That's not a defect — that's the entire point. The technology only activates against a hard tooth surface. The silence is exactly why skittish dogs tolerate it when they'd never tolerate a noisy groomer tool.";

export function SilentReassurance({
  note,
  heading = "Read this before your first use — it's supposed to feel \"broken\"",
}: Props) {
  const body = note?.trim() || DEFAULT_NOTE;

  return (
    <section className="bg-paper pt-0 pb-14 md:pb-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid items-center gap-7 rounded-2xl bg-cocoa p-8 md:grid-cols-[auto_1fr] md:gap-10 md:p-10">
          {/* Round badge */}
          <div className="mx-auto md:mx-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold bg-gold/15 text-5xl">
              🤫
            </div>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-display mb-2 text-2xl font-bold text-white md:text-[24px]">
              {heading}
            </h3>
            <p className="text-[15px] leading-relaxed text-[#D6D2C2]">
              {body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
