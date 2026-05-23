import type { Guarantee } from "@/types/metafields";

// Plan §Phase 4: final reassurance moment before the conversion. Reference
// shows a single 30-day-promise card with a radial-gradient gold seal.
// Editors override per-product via beepaws.guarantee metafield (list with
// one entry); empty falls back to the dental-scaler default.

const DEFAULT_GUARANTEE: Guarantee = {
  sealNumber: "30",
  sealLabel: "Day Promise",
  title: "Try it on your couch, risk-free for 30 days",
  description:
    "Clean your pet's teeth at home for a full month. If you don't see the hardened plaque chipping away — or if it's simply not the right fit — return it for a complete refund. The only thing you're risking is your dog's bad breath.",
};

interface Props {
  guarantee?: Guarantee[] | null;
}

export function GuaranteeBlock({ guarantee }: Props) {
  // Metafield is a single-entry list (the editor adds one item); pick [0].
  const g = guarantee?.[0] ?? DEFAULT_GUARANTEE;

  return (
    <section className="bg-cream py-14 md:py-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="grid items-center gap-7 rounded-2xl border-2 border-gold bg-card p-8 shadow-[0_14px_40px_-16px_rgba(74,46,22,0.18)] md:grid-cols-[auto_1fr] md:gap-8 md:p-10">
          {/* Radial-gradient gold seal */}
          <div className="mx-auto md:mx-0">
            <div
              className="flex h-32 w-32 flex-col items-center justify-center rounded-full text-cocoa shadow-[0_8px_24px_-8px_rgba(74,46,22,0.4)]"
              style={{
                background: "radial-gradient(circle at 38% 32%, #E7A92F, #C8901C)",
              }}
            >
              <span className="font-display text-[38px] font-bold leading-none">
                {g.sealNumber}
              </span>
              <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.08em]">
                {g.sealLabel}
              </span>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h2 className="font-display mb-2 text-2xl font-bold leading-tight text-cocoa md:text-[26px]">
              {g.title}
            </h2>
            <p className="text-[15px] leading-relaxed text-brown">
              {g.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
