import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { contentIcon } from "@/lib/content-icons";
import { withInline } from "@/lib/inline-format";
import type { Listicle, ListicleBlock, ListicleImage } from "@/lib/shopify/listicles";
import { StickyCta } from "@/components/journal/StickyCta";
import { ChecklistTicks } from "@/components/journal/ChecklistTicks";

/**
 * An admin-authored listicle (/journal/<slug>), built to the visual reference
 * (docs/admin-handoff-listicles.md → the owner's BeePaws_Listicle_Visual_Reference):
 * a magazine feature, not a landing page. One 720px column, no sidebar, no grid;
 * reasons read top to bottom, each "01. Heading" in the display serif, a thin
 * honey rule after it. Site fonts and colours (Fraunces / Hanken Grotesk, Warm
 * Honey tokens). No motion except the floating button, the checklist's ticks
 * (they fill once the reader finishes the list) and hover states.
 *
 * Server component. Product prices come in resolved from the store (`products`),
 * so the card can't show a stale number.
 */

export type ListicleProductInfo = { price: string | null; image: ListicleImage | null; title: string };

// Desktop measure (sweep S7, 2026-10-13): 18px in a 680px text column held ~87
// characters per full line; 19px in 620px holds ~73 (comfortable is 60–75).
// Phones are unchanged (16px, full width).
// Wide screens (owner, 2026-10-14: on a 1920px display the 620px column read
// "squished in the middle"): the whole article scales up from xl and 2xl —
// column, body size, headings and images together — so it fills more of the
// screen while lines stay ~70 characters (700px at 20px, 740px at 21px).
const COLUMN = "mx-auto w-full max-w-[660px] px-5 xl:max-w-[740px] 2xl:max-w-[780px]";
const BODY = "text-[16px] leading-[1.7] text-ink md:text-[19px] xl:text-[20px] 2xl:text-[21px]";

/** The ==highlight== colours (the admin's HIGHLIGHT_COLORS — keep in sync). The
 *  marker in lib/inline-format.tsx reads them through the --hl variable. */
const HIGHLIGHT_CSS = {
  honey: "rgb(231 169 47 / 0.6)",
  amber: "rgb(221 138 56 / 0.6)",
  clay: "rgb(197 106 30 / 0.5)",
  brown: "rgb(74 46 22 / 0.35)",
} as const;

/** Section backgrounds: anything but "plain" is a full-width band. Light bands
 *  only — readability first: dark text on white or a pale honey (owner,
 *  2026-10-06; sand read as dim and a dark band was hard to read). */
const TONE_BG = { white: "bg-card", honey: "bg-honey-tint" } as const;
const MUTED = "text-brown/80"; // the guide's "muted stone" role, AA on paper

/** Blank line = new paragraph; a single line break stays a line break. */
function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={`mt-5 first:mt-0 ${className}`}>
            {p.split("\n").map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {withInline(line)}
              </Fragment>
            ))}
          </p>
        ))}
    </>
  );
}

/** A framed picture that reaches past the text column (see below). In the
 *  admin's draft preview an empty slot shows as a dashed box naming the image,
 *  so the page's structure can be judged before the pictures exist; the live
 *  page skips empty slots. */
function Figure({
  image,
  priority,
  preview,
  flushTop,
}: {
  image: ListicleImage;
  priority?: boolean;
  preview?: boolean;
  /** At the top of a padded card (the product card): run to the card's top
   *  edge on phones and sit inside the padding from md — no extra margin and
   *  no frame, the card is the frame (sweep S5, 2026-10-13). */
  flushTop?: boolean;
}) {
  // Every other image is FRAMED (owner, 2026-10-13: edge-to-edge photos on
  // phones looked too big; "smaller, with a border outside"): a white mat, a
  // hairline border, rounded corners and a soft shadow — a print laid on the
  // page. Inside the text margins it then read too small, so the frame reaches
  // PAST the column while the text stays put: 8px from the screen edge on
  // phones (thinner mat), 32px out on tablets (a 768px screen leaves 54px
  // beside the 660px column), 70px out from lg — image ~364px wide on a 390px
  // phone (was 336), ~746px on desktop (was 606). The caption stays in the
  // text column, under the picture.
  const place = flushTop ? "-mx-5 -mt-7 md:mx-0 md:mt-0" : "-mx-3 mt-8 md:-mx-8 lg:-mx-[70px] xl:-mx-[110px] 2xl:-mx-[130px]";
  const frame = flushTop
    ? ""
    : "rounded-xl border border-line bg-card p-1 shadow-[0_3px_14px_-8px_rgba(74,46,22,0.28)] md:p-1.5";
  const radius = flushTop ? "md:rounded-lg" : "rounded-lg";
  const caption = image.caption && (
    <figcaption className={`mt-2 text-[13px] italic ${flushTop ? "px-5 md:px-0" : "px-3 md:px-8 lg:px-[70px] xl:px-[110px] 2xl:px-[130px]"} ${MUTED}`}>
      {image.caption}
    </figcaption>
  );
  if (!image.src) {
    if (!preview) return null;
    return (
      <figure className={place}>
        <div className={frame}>
          <div className={`flex aspect-[3/2] w-full items-center justify-center border-2 border-dashed border-line bg-cream-deep px-8 text-center text-[13px] leading-snug text-brown/80 ${radius}`}>
            Image goes here{image.alt ? ` — ${image.alt}` : ""}
          </div>
        </div>
        {caption}
      </figure>
    );
  }
  return (
    <figure className={place}>
      <div className={frame}>
        {image.width && image.height ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes={flushTop ? "(max-width: 768px) 92vw, 620px" :"(max-width: 767px) 94vw, (max-width: 1023px) 670px, (max-width: 1279px) 746px, (max-width: 1535px) 906px, 986px"}
            priority={priority}
            className={`h-auto w-full ${radius}`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- size unknown (older draft): let it size itself
          <img src={image.src} alt={image.alt} className={`h-auto w-full ${radius}`} />
        )}
      </div>
      {caption}
    </figure>
  );
}

function Button({ href, label, note }: { href: string; label: string; note?: string }) {
  if (!label || !href) return null;
  return (
    // data-listicle-cta: the floating button hides while a page button is on screen.
    <div className="mt-8 text-center" data-listicle-cta="">
      <Link
        href={href}
        className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-8 py-4 text-[17px] font-bold text-cocoa pressable hover:bg-gold-deep md:w-auto"
      >
        {label}
      </Link>
      {note && <p className={`mt-3 text-[13px] ${MUTED}`}>{note}</p>}
    </div>
  );
}

/** An empty checkbox that fills honey and draws its tick when the sheet around
 *  it is ticked (ChecklistTicks sets data-ticked). `delay` staggers the rows. */
function TickBox({ tick, delay }: { tick: boolean; delay: number }) {
  return (
    <span
      aria-hidden
      className={`mt-[2px] flex size-[22px] flex-none items-center justify-center rounded-[6px] border-2 border-brown/45 bg-paper md:mt-[3px] md:size-6 ${
        tick
          ? "transition-[background-color,border-color] duration-200 group-data-[ticked]/sheet:animate-[tick-pop_360ms_ease-out_both] group-data-[ticked]/sheet:border-gold group-data-[ticked]/sheet:bg-gold motion-reduce:transition-none group-data-[ticked]/sheet:motion-reduce:animate-none print:border-gold print:bg-gold"
          : ""
      }`}
      style={tick ? { transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` } : undefined}
    >
      {tick && (
        <svg viewBox="0 0 24 24" className="size-[15px] text-cocoa md:size-4" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          {/* pathLength 1: the dash trick draws the tick from its short arm. */}
          <path
            d="M4 12.5 9.5 18 20 6.5"
            pathLength={1}
            className="transition-[stroke-dashoffset] duration-300 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-[ticked]/sheet:[stroke-dashoffset:0] motion-reduce:transition-none print:[stroke-dashoffset:0]"
            style={{ transitionDelay: `${delay + 120}ms` }}
          />
        </svg>
      )}
    </span>
  );
}

function SubHeading({ text }: { text: string }) {
  return <h3 className="mt-10 font-display text-[21px] font-bold text-cocoa md:text-[24px] xl:text-[26px] 2xl:text-[27px]">{withInline(text)}</h3>;
}

/** Sand box on desktop; on phones a left honey border with no fill (less weight). */
const BOX = "mt-8 border-l-[3px] border-gold pl-4 md:rounded md:border-l-0 md:bg-cream-deep md:p-6";

function Block({ b, products, preview }: { b: ListicleBlock; products: Record<string, ListicleProductInfo>; preview?: boolean }) {
  switch (b.type) {
    case "text":
      return (
        <div className={`mt-5 ${BODY}`}>
          <Paragraphs text={b.text} />
        </div>
      );
    case "image":
      return <Figure image={b.image} preview={preview} />;
    case "quote":
      if (!b.text.trim()) return null;
      return (
        <figure className={BOX}>
          <blockquote className={`${BODY} italic`}>
            <Paragraphs text={b.text} />
          </blockquote>
          {b.attribution && <figcaption className={`mt-3 text-[14px] ${MUTED}`}>{withInline(b.attribution)}</figcaption>}
        </figure>
      );
    case "callout":
      return (
        <aside className={BOX}>
          {b.title && <p className="font-display text-[19px] font-bold text-cocoa md:text-[21px] xl:text-[22px] 2xl:text-[23px]">{withInline(b.title)}</p>}
          <div className={`${b.title ? "mt-3" : ""} ${BODY}`}>
            <Paragraphs text={b.text} />
          </div>
        </aside>
      );
    case "cards": {
      // ONE sheet with tick boxes, not a stack of cards (owner, 2026-10-13:
      // "just a bunch of cards"). The copy calls it a checklist and pays it
      // off with "checks every box above", so the boxes start empty — the
      // list stays neutral while it's read — and, with tickOnRead, tick in a
      // quick cascade once the reader finishes it (ChecklistTicks). The
      // BeePaws answer under an item stays visible in muted brown and turns
      // clay as its box ticks — hiding it until then left an empty gap in
      // every row, and growing the row at the tick would push the text the
      // reader is on down the screen.
      const tick = b.tickOnRead ?? true;
      const sheet = (
        <>
          {b.title && <h3 className="font-display text-[20px] font-bold leading-tight text-cocoa md:text-[23px] xl:text-[25px] 2xl:text-[26px]">{withInline(b.title)}</h3>}
          <ul className={b.title ? "mt-4 border-t border-line" : ""}>
            {b.items.map((c, i) => (
              <li key={i} className={`flex break-inside-avoid gap-3 border-line py-4 last:pb-0 md:gap-4 md:py-5 ${i > 0 ? "border-t" : ""} ${!b.title && i === 0 ? "pt-0" : ""}`}>
                <TickBox tick={tick} delay={i * 90} />
                <div className="min-w-0 flex-1">
                  {c.title && <p className="text-[17px] font-bold leading-snug text-cocoa md:text-[18px] xl:text-[20px] 2xl:text-[21px]">{withInline(c.title)}</p>}
                  {c.text && (
                    <div className={`mt-1.5 ${BODY}`}>
                      <Paragraphs text={c.text} />
                    </div>
                  )}
                  {c.check && (
                    <p
                      className={`mt-2.5 text-[14px] font-semibold md:text-[15px] ${tick ? `${MUTED} transition-colors duration-300 group-data-[ticked]/sheet:text-clay-deep motion-reduce:transition-none print:text-clay-deep` : "text-clay-deep"}`}
                      style={tick ? { transitionDelay: `${i * 90 + 150}ms` } : undefined}
                    >
                      {c.check}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      );
      // On phones the sheet reaches out like the images (8px from the screen
      // edge, tighter padding): inside the text margins the tick-box column
      // left ~274px for the text and the sheet came out taller than the
      // cards it replaced.
      const frame = "-mx-3 mt-8 rounded-lg bg-cream-deep px-4 py-6 md:mx-0 md:px-8 md:py-7";
      return tick ? <ChecklistTicks className={frame}>{sheet}</ChecklistTicks> : <div className={frame}>{sheet}</div>;
    }
    case "timeline":
      // Stops on a path, at every width (sweep S4, 2026-10-13 — the guide asks
      // for "a visual timeline or stepped cards"; phones used to get plain
      // stacked blocks). Same language as the PDP's Calm Start timeline, lighter
      // for a reading column: no cards, dots not numbers (the reasons already
      // count 01–08), and the LAST stop filled in as the goal. The path is drawn
      // per segment, from under one marker to the next, so it ends exactly at
      // the last stop; it warms from gold to clay-deep.
      return (
        <>
        {b.title && <SubHeading text={b.title} />}
        <ol className="mt-8">
          {b.items.map((s, i) => {
            const last = i === b.items.length - 1;
            const segment = ["from-gold to-amber", "from-amber to-amber", "from-amber to-clay", "from-clay to-clay-deep"][Math.min(i, 3)];
            return (
              <li key={i} className="relative flex gap-4 break-inside-avoid pb-8 last:pb-0 md:gap-5">
                {!last && (
                  <span aria-hidden className={`absolute bottom-0 left-[11px] top-7 w-[3px] bg-gradient-to-b ${segment}`} />
                )}
                <span
                  aria-hidden
                  className={`relative z-10 mt-[3px] flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full ${
                    last ? "bg-clay-deep" : "bg-card ring-2 ring-gold"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${last ? "bg-cream-deep" : "bg-gold"}`} />
                </span>
                <div className="min-w-0 flex-1">
                  {s.label && (
                    <p className="font-display text-[19px] font-bold leading-snug text-cocoa md:text-[21px] xl:text-[22px] 2xl:text-[23px]">{withInline(s.label)}</p>
                  )}
                  <div className={`mt-1.5 ${BODY}`}>
                    <Paragraphs text={s.text} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        </>
      );
    case "cta":
      if (b.style === "link") {
        if (!b.label || !b.href) return null;
        return (
          // data-listicle-cta: the floating button steps aside here too — it
          // said the same words right under this link (2026-10-07).
          <p className={`mt-6 text-[15px] italic ${MUTED}`} data-listicle-cta="">
            {/* -my-3 py-3: a ~44px tall hit area (was 20px) on the same line. */}
            <Link href={b.href} className="-my-3 inline-block py-3 underline decoration-gold decoration-2 underline-offset-2 hover:text-cocoa">
              {b.label}
            </Link>
          </p>
        );
      }
      return <Button href={b.href} label={b.label} note={b.note} />;
    case "sources":
      if (!b.items.length) return null;
      // After the story is over, in small muted type: credibility for the
      // sceptical reader without competing with the copy. Always shown (owner,
      // 2026-10-13) — it was collapsed under one line (visual plan #7), which
      // hid the very numbers it backs up.
      return (
        <section className="mt-10 border-t border-line pt-5">
          <h3 className={`text-[14px] font-semibold ${MUTED}`}>{b.title || "Sources"}</h3>
          <ol className={`mt-3 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed ${MUTED}`}>
            {b.items.map((x, i) => (
              <li key={i}>{withInline(x)}</li>
            ))}
          </ol>
        </section>
      );
    case "product": {
      const info = b.product ? products[b.product.handle] : undefined;
      const href = b.ctaHref || (b.product ? `/products/${b.product.handle}` : "");
      const image = b.image.src ? b.image : info?.image;
      return (
        // data-listicle-end: the floating button is gone from here on.
        <section data-listicle-end="" className="mt-10 break-inside-avoid overflow-hidden rounded-lg bg-cream-deep px-5 py-7 text-center md:p-8">
          {image && <Figure image={image} flushTop />}
          <h3 className="mt-6 font-display text-[26px] font-bold leading-tight tracking-tight text-cocoa md:text-[30px] xl:text-[33px] 2xl:text-[35px]">
            {b.name || info?.title || b.product?.title}
          </h3>
          {b.contents.length > 0 && (
            <div className="mx-auto mt-5 max-w-sm text-left">
              {b.contentsTitle && <p className="text-[15px] font-bold text-cocoa">{b.contentsTitle}</p>}
              <ul className="mt-2 space-y-1.5">
                {b.contents.map((c, i) => (
                  <li key={i} className={`flex gap-2 ${BODY} md:text-[17px] xl:text-[18px] 2xl:text-[18px]`}>
                    <Check size={18} className="mt-1 flex-none text-gold" strokeWidth={3} aria-hidden />
                    <span>{withInline(c)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {b.note && <p className={`mx-auto mt-4 max-w-md text-[14px] ${MUTED}`}>{withInline(b.note)}</p>}
          {info?.price && <p className="mt-6 text-[28px] font-bold text-cocoa">{info.price}</p>}
          {b.compareLine && <p className={`mt-1 text-[14px] ${MUTED}`}>{b.compareLine}</p>}
          <Button href={href} label={b.ctaLabel} note={b.ctaNote} />
          {/* Trust row (visual plan #6): the buy box's promises, at the decision
              point. Icons resolve server-side from the content-icon catalog. */}
          {b.trust.length > 0 && (
            <ul
              className="mx-auto mt-6 grid max-w-md gap-3"
              style={{ gridTemplateColumns: `repeat(${b.trust.length}, minmax(0, 1fr))` }}
            >
              {b.trust.map((t, i) => {
                const Icon = contentIcon(t.icon, ShieldCheck);
                return (
                  <li key={i} className="flex flex-col items-center gap-1.5 text-center">
                    <Icon size={22} strokeWidth={1.8} className="text-clay" aria-hidden />
                    <span className="text-balance text-[13px] font-medium leading-snug text-brown">{t.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      );
    }
  }
}

export function ListicleView({
  listicle: l,
  products,
  preview,
}: {
  listicle: Listicle;
  products: Record<string, ListicleProductInfo>;
  /** The admin's draft preview: empty image slots show as placeholders. */
  preview?: boolean;
}) {
  // Reasons are numbered by order. The floating button may start showing at
  // reason `stickyCta.fromReason` (data-listicle-start) — the first reason when
  // that one doesn't exist.
  const reasonNo: (number | null)[] = [];
  let count = 0;
  for (const s of l.sections) reasonNo.push(s.kind === "reason" ? ++count : null);
  const wanted = reasonNo.indexOf(l.stickyCta.fromReason ?? 1);
  const startAt = wanted >= 0 ? wanted : reasonNo.findIndex((n) => n !== null);
  const byline = [l.byline.author, l.byline.date, l.byline.readTime].filter(Boolean).join(" · ");

  return (
    // A soft warm white, halfway between white and the old cream (owner,
    // 2026-10-13: the cream read "a bit too heavy" over a ten-minute read;
    // pure white was too stark) — the site's paper since 2026-10-14. The old
    // cream (cream-deep) marks the boxes — product card, checklist, callouts —
    // which stand out more against it.
    <article className="bg-paper pb-16 md:pb-24" style={{ "--hl": HIGHLIGHT_CSS[l.highlight] } as CSSProperties}>
      <header className={`${COLUMN} pt-6 md:pt-10`}>
        {l.topStrip && <p className={`text-[13px] font-semibold ${MUTED}`}>{l.topStrip}</p>}
        {/* tracking-tight on the large serif (sweep S8): at 32–46px default
            letter-spacing reads loose; the PDP's headings are tightened too. */}
        <h1 className="mt-6 font-display text-[32px] font-bold leading-[1.12] tracking-tight text-cocoa md:mt-8 md:text-[46px] xl:text-[52px] 2xl:text-[56px]">{l.headline}</h1>
        {l.subhead && <p className="mt-4 text-[18px] leading-snug text-brown md:text-[21px] xl:text-[22px] 2xl:text-[23px]">{withInline(l.subhead)}</p>}
        {byline && <p className={`mt-5 text-[14px] ${MUTED}`}>{byline}</p>}
        {l.checklist.length > 0 && (
          <ul className="mt-7 space-y-2.5">
            {l.checklist.map((c, i) => (
              <li key={i} className={`flex gap-3 ${BODY}`}>
                <Check size={20} className="mt-[0.2em] flex-none text-gold" strokeWidth={3} aria-hidden />
                <span>{withInline(c)}</span>
              </li>
            ))}
          </ul>
        )}
        <Button href={l.topCta.href} label={l.topCta.label} note={l.topCta.note} />
        <Figure image={l.hero} priority preview={preview} />
      </header>

      {l.sections.map((s, i) => {
        const n = reasonNo[i];
        const first = i === startAt;
        // Section breaks halved (owner, 2026-10-13: the gaps "cut off the flow
        // of the copy"): 80/112px before a section plus 56/80px after a
        // reason's gold rule read as a stop, against ~18px between paragraphs.
        const gap = "mt-10 md:mt-14";
        const inner = (
          <>
            {s.heading && (
              <h2
                {...(first ? { "data-listicle-start": "" } : {})}
                className={`font-display font-bold leading-tight tracking-tight text-cocoa ${s.kind === "intro" ? "text-[24px] md:text-[28px] xl:text-[30px] 2xl:text-[32px]" : "text-[26px] md:text-[34px] xl:text-[37px] 2xl:text-[40px]"}`}
              >
                {/* The number in clay, the heading in brown: a colour cue for skimming,
                    still the same serif on the same line (visual guide §3). Clay, not
                    honey — honey gold is too pale to read on cream (3.6:1 vs 2:1). */}
                {n !== null && <span className="text-clay">{String(n).padStart(2, "0")}. </span>}
                {withInline(s.heading)}
              </h2>
            )}
            {s.blocks.map((b) => (
              <Block key={b.id} b={b} products={products} preview={preview} />
            ))}
          </>
        );
        if (s.tone !== "plain") {
          // A band: edge to edge, the text still in the one column. The
          // band's edges separate it from its neighbours, so no gold rule.
          return (
            <section key={s.id} className={`${gap} ${TONE_BG[s.tone]} py-16 md:py-24`}>
              <div className={COLUMN}>{inner}</div>
            </section>
          );
        }
        return (
          <section key={s.id} className={`${COLUMN} ${gap}`}>
            {inner}
            {s.kind === "reason" && <hr aria-hidden className="mx-auto mt-10 w-20 border-0 border-t-2 border-gold/70 md:mt-14" />}
          </section>
        );
      })}

      {(l.footer.line || l.footer.disclaimer) && (
        <footer className={`${COLUMN} mt-20 border-t border-line pt-6 md:mt-28`}>
          {l.footer.line && <p className={`text-[14px] italic ${MUTED}`}>{l.footer.line}</p>}
          {l.footer.disclaimer && <p className={`mt-2 text-[12.5px] leading-relaxed ${MUTED}`}>{l.footer.disclaimer}</p>}
        </footer>
      )}

      {l.stickyCta.enabled && l.stickyCta.label && l.stickyCta.href && <StickyCta label={l.stickyCta.label} href={l.stickyCta.href} />}
    </article>
  );
}
