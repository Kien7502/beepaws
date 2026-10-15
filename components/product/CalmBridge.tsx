import { Fragment } from "react";

/**
 * The dark one-line strip between How it works and the Calm Start Protocol
 * (PDP revision round 2 #3, 2026-10-14): it closes the mechanism section — which
 * ended abruptly once the "feels broken" callout went — and hands over to the
 * protocol below. Authored as Calm Start's "bridge" line in the admin editor.
 * `**text**` renders in honey gold: the headings' clay accent doesn't read on
 * a dark band. A gold phrase that ENDS the line gets its own line — statement,
 * then the call to action ("That's the method. / Here's how to start.") — and a
 * short one never splits; a first render stranded "to start." / "lap.".
 */
export function CalmBridge({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  // split() leaves an empty last part when the text ends on a **gold** run.
  const endsGold = parts.length > 1 && parts[parts.length - 1].trim() === "";
  return (
    <div className="bg-bark px-6 py-9 text-center md:py-11">
      <p className="mx-auto max-w-3xl text-balance type-h3 text-cream">
        {parts.map((p, i) =>
          i % 2 === 1 ? (
            <span
              key={i}
              className={`text-gold ${endsGold && i === parts.length - 2 ? "block" : ""} ${p.length <= 32 ? "whitespace-nowrap" : ""}`}
            >
              {p}
            </span>
          ) : (
            <Fragment key={i}>{p}</Fragment>
          ),
        )}
      </p>
    </div>
  );
}
