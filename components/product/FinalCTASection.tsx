"use client";

import type { Guarantee } from "@/types/metafields";

// Lean final-CTA: bark band, headline + body + ONE gold CTA + guarantee card.
// Layout reorder (per user feedback): the buy button now sits directly under
// the body copy (decision moment), and the guarantee card below is a clean
// badge + title + description block — no button inside breaking up the seal/
// text alignment. Matches the standalone GuaranteeBlock visual we had before
// the restructure plan merged it into this section.
//
// "use client" — the button does an onClick scrollIntoView to the FBT card
// up in the hero pinfo (id="fbt"). Using an in-page `<Link href="#fbt">`
// changes the URL fragment and stops re-scrolling on repeat clicks; an
// imperative scroll fires every time and leaves the URL alone.

// Lorem ipsum placeholder — set the beepaws.guarantee metafield (single-entry
// list) to override with the real promise copy. Seal number/label stay
// concrete so the badge reads as a real seal.
const DEFAULT_GUARANTEE: Guarantee = {
  sealNumber: "30",
  sealLabel: "Day Promise",
  title: "Lorem ipsum dolor sit amet, consectetur",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
};

interface Props {
  /** Pre-formatted "from" price for the button label, e.g. "$59". */
  fromPrice: string;
  /** DOM id the button scrolls to — defaults to "fbt" (the Frequently Bought
   *  Together card in the hero pinfo). Target element should set
   *  scrollMarginTop to clear the sticky header. */
  scrollTargetId?: string;
  heading?: string;
  body?: string;
  /** Small-print promise line under the guarantee card. · separated. */
  smallPrint?: string;
  /** Editor-overridable guarantee block (single-entry list metafield). */
  guarantee?: Guarantee[] | null;
}

export function FinalCTASection({
  fromPrice,
  scrollTargetId = "fbt",
  heading = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  body = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  smallPrint = "Lorem ipsum · Dolor sit amet · Consectetur adipiscing",
  guarantee,
}: Props) {
  const g = guarantee?.[0] ?? DEFAULT_GUARANTEE;

  function onShopClick() {
    document
      .getElementById(scrollTargetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="ds-reveal-in bg-bark py-14 md:py-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight text-white md:text-[34px]">
            {heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-[#CFCBBA] md:text-base">
            {body}
          </p>

          {/* Button — promoted directly under the body copy so the decision
              moment lands before the guarantee reassurance below. Imperative
              scroll (vs in-page Link) so repeat clicks always re-scroll. */}
          <button
            type="button"
            onClick={onShopClick}
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-base font-bold text-cocoa shadow-sm transition-colors hover:bg-gold-deep hover:text-white md:text-lg"
          >
            Shop the bundle — From {fromPrice}
          </button>

          {/* Guarantee card — paper island on the bark section (matches the
              Header bg). Badge left, title + description right; no button
              inside, so the seal sits in line with the text it certifies. */}
          <div className="mt-9 grid items-center gap-7 rounded-2xl border-2 border-gold bg-paper p-7 text-left shadow-[0_14px_40px_-16px_rgba(0,0,0,0.4)] md:mt-10 md:grid-cols-[auto_1fr] md:gap-9 md:p-9">
            <div className="mx-auto md:mx-0">
              <div
                className="flex h-28 w-28 flex-col items-center justify-center rounded-full text-cocoa shadow-[0_8px_24px_-8px_rgba(74,46,22,0.45)]"
                style={{ background: "radial-gradient(circle at 38% 32%, #E7A92F, #C8901C)" }}
              >
                <span className="font-display text-[34px] font-bold leading-none">{g.sealNumber}</span>
                <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.08em]">{g.sealLabel}</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-display text-xl font-semibold leading-tight text-cocoa md:text-2xl">
                {g.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-brown md:text-[15px]">
                {g.description}
              </p>
            </div>
          </div>

          {/* Small print mirrors the mini-trust 3-up in the hero pinfo so the
              page opens and closes on the same three promises. */}
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.08em] text-[#A8A48F]">
            {smallPrint}
          </p>
        </div>
      </div>
    </section>
  );
}
