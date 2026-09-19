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
