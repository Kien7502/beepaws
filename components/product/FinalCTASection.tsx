import Link from "next/link";

// Lean final-CTA per device reference §FINAL CTA — cocoa band, headline +
// body + ONE gold button (price baked in) + small print. The FBT cross-sell
// lives in its own cream section above this (rendered in app/products/[handle]/page.tsx).

interface Props {
  /** Pre-formatted "from" price for the button label, e.g. "$59". */
  fromPrice: string;
  /** Anchor target the button scrolls back to — defaults to the sticky CTA
   *  sentinel just under the buy area at the top of the page. */
  buyHref?: string;
  heading?: string;
  body?: string;
}

export function FinalCTASection({
  fromPrice,
  buyHref = "#sticky-cta-trigger",
  heading = "Your vet's $1,400 quote just became optional",
  body = "Bring the operatory technology home — and become the calm, capable protector your pet already thinks you are.",
}: Props) {
  return (
    <section className="bg-cocoa py-14 md:py-20">
      <div className="container mx-auto max-w-2xl px-4 md:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-[34px]">
            {heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-[#CFCBBA] md:text-base">
            {body}
          </p>
          <Link
            href={buyHref}
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-4 text-base font-extrabold text-cocoa shadow-sm transition-colors hover:bg-gold-deep hover:text-white md:text-lg"
          >
            Shop the bundle — From {fromPrice}
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-[#A8A48F]">
            Free 2–5 day shipping · 30-day money-back · Silent &amp; vibration-free
          </p>
        </div>
      </div>
    </section>
  );
}
