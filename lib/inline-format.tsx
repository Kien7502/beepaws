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

/**
 * Editorial copy (the listicles, 2026-10-06): `**bold**`, `==highlight==`,
 * `*italic*` and `[label](https://…)` links — still no HTML. The highlight is a
 * honey marker stroke over the lower half of the words (visual plan #5,
 * 2026-10-07): for the one line a skimmer must not miss. Same safety rule as withBold: the
 * text is split and handed to React, so it stays escaped, and a link only
 * renders for an internal path or an http(s) URL (anything else stays literal
 * text). External links open in a new tab.
 */
export function withInline(text: string): ReactNode {
  if (!/[*[=]/.test(text)) return text;
  const out: ReactNode[] = [];
  // bold before italic so `**x**` isn't read as two italics
  // A highlight can't start or end with a space ("a == b == c" is not one).
  const re = /\*\*([\s\S]+?)\*\*|==(?=\S)([^=\n]*?\S)==|\*([^*\n]+?)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = out.length;
    if (m[1] !== undefined) out.push(<strong key={key} className="font-bold text-cocoa">{withInline(m[1])}</strong>);
    else if (m[2] !== undefined)
      out.push(
        // A thin honey band just BELOW the letters (owner, 2026-10-07: the first
        // version filled the lower half of the words and looked heavy). An
        // underline follows wrapped lines on its own and never covers the text;
        // 5px translucent keeps it distinct from links (2px solid gold).
        <mark
          key={key}
          className="bg-transparent text-inherit underline decoration-[rgb(231_169_47_/_0.6)] decoration-[5px] underline-offset-[3px] [text-decoration-skip-ink:none]"
        >
          {withInline(m[2])}
        </mark>,
      );
    else if (m[3] !== undefined) out.push(<em key={key}>{m[3]}</em>);
    else {
      const href = m[5];
      const internal = href.startsWith("/") && !href.startsWith("//");
      const external = /^https?:\/\//i.test(href);
      out.push(
        internal || external ? (
          <a
            key={key}
            href={href}
            className="underline decoration-gold decoration-2 underline-offset-2 hover:text-cocoa"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {m[4]}
          </a>
        ) : (
          m[0]
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.map((n, i) => (typeof n === "string" ? <Fragment key={`t${i}`}>{n}</Fragment> : n));
}
