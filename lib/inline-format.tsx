import { Fragment, type ReactNode } from "react";

/**
 * Renders `**bold**` markers inside authored copy — and nothing else.
 *
 * Body copy on the PDP is authored in Shopify metafields as PLAIN TEXT (the
 * deliberate decision: no rich text, no HTML, so a content edit can never inject
 * markup). But a wall of evenly-weighted text is a wall: the sentence that
 * carries the argument should be able to stand out. This is the smallest thing
 * that allows that — a marker the author types, parsed here into <strong>.
 *
 * Nothing is dangerouslySet: the text is split and handed to React, so it stays
 * escaped. Unmatched `**` is left as literal text rather than swallowed.
 */
export function withBold(text: string): ReactNode {
  if (!text.includes("**")) return text;
  const parts = text.split(/\*\*([\s\S]+?)\*\*/g)  // [\s\S] not /s — the dotAll flag needs a newer TS target;
  return parts.map((part, i) =>
    // odd indices are the captured groups = the bolded runs
    i % 2 === 1 ? <strong key={i} className="font-bold text-cocoa">{part}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/**
 * The same `**marker**`, for HEADINGS: the run renders in the brand accent
 * instead of bold (a display heading is already bold, so weight says nothing
 * there — colour does). One accented phrase gives a section heading a focal
 * point without putting a label above it; the per-section uppercase kicker was
 * removed on purpose in 78b04ab and is not coming back.
 */
export function withAccent(text: string): ReactNode {
  if (!text.includes("**")) return text;
  const parts = text.split(/\*\*([\s\S]+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <span key={i} className="text-clay">{part}</span> : <Fragment key={i}>{part}</Fragment>,
  );
}
