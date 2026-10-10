import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { contentIcon } from "@/lib/content-icons";
import { withInline } from "@/lib/inline-format";
import type { Listicle, ListicleBlock, ListicleImage } from "@/lib/shopify/listicles";
import { StickyCta } from "@/components/journal/StickyCta";

/**
 * An admin-authored listicle (/journal/<slug>), built to the visual reference
 * (docs/admin-handoff-listicles.md → the owner's BeePaws_Listicle_Visual_Reference):
 * a magazine feature, not a landing page. One 720px column, no sidebar, no grid;
 * reasons read top to bottom, each "01. Heading" in the display serif, a thin
 * honey rule after it. Site fonts and colours (Fraunces / Hanken Grotesk, Warm
 * Honey tokens). No motion except the floating button and hover states.
 *
 * Server component. Product prices come in resolved from the store (`products`),
 * so the card can't show a stale number.
 */

export type ListicleProductInfo = { price: string | null; image: ListicleImage | null; title: string };

const COLUMN = "mx-auto w-full max-w-[720px] px-5";
const BODY = "text-[16px] leading-[1.7] text-ink md:text-[18px]";

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

/** Full column width on desktop with 8px corners; full-bleed on phones. In the
 *  admin's draft preview an empty slot shows as a dashed box naming the image,
 *  so the page's structure can be judged before the pictures exist; the live
 *  page skips empty slots. */
function Figure({ image, priority, preview }: { image: ListicleImage; priority?: boolean; preview?: boolean }) {
  if (!image.src) {
    if (!preview) return null;
    return (
      <figure className="-mx-5 mt-8 md:mx-0">
        <div className="flex aspect-[3/2] w-full items-center justify-center border-2 border-dashed border-line bg-cream px-8 text-center text-[13px] leading-snug text-brown/80 md:rounded-lg">
          Image goes here{image.alt ? ` — ${image.alt}` : ""}
        </div>
        {image.caption && <figcaption className={`mt-2 px-5 text-[13px] italic md:px-0 ${MUTED}`}>{image.caption}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="-mx-5 mt-8 md:mx-0">
      {image.width && image.height ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(max-width: 768px) 100vw, 680px"
          priority={priority}
          className="h-auto w-full md:rounded-lg"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- size unknown (older draft): let it size itself
        <img src={image.src} alt={image.alt} className="h-auto w-full md:rounded-lg" />
      )}
      {image.caption && <figcaption className={`mt-2 px-5 text-[13px] italic md:px-0 ${MUTED}`}>{image.caption}</figcaption>}
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
        className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-8 py-4 text-[17px] font-bold text-cocoa transition-colors hover:bg-gold-deep md:w-auto"
      >
        {label}
      </Link>
      {note && <p className={`mt-3 text-[13px] ${MUTED}`}>{note}</p>}
    </div>
  );
}

function SubHeading({ text }: { text: string }) {
  return <h3 className="mt-10 font-display text-[21px] font-bold text-cocoa md:text-[24px]">{withInline(text)}</h3>;
}

/** Sand box on desktop; on phones a left honey border with no fill (less weight). */
const BOX = "mt-8 border-l-[3px] border-gold pl-4 md:rounded md:border-l-0 md:bg-cream md:p-6";

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
          {b.title && <p className="font-display text-[19px] font-bold text-cocoa md:text-[21px]">{withInline(b.title)}</p>}
          <div className={`${b.title ? "mt-3" : ""} ${BODY}`}>
            <Paragraphs text={b.text} />
          </div>
        </aside>
      );
    case "cards":
      return (
        <>
        {b.title && <SubHeading text={b.title} />}
        <div className="mt-8 flex flex-col gap-4">
          {b.items.map((c, i) => (
            <div key={i} className="break-inside-avoid rounded bg-cream p-4 md:p-5">
              {c.title && <p className="text-[17px] font-bold leading-snug text-cocoa md:text-[18px]">{withInline(c.title)}</p>}
              {c.text && (
                <div className={`mt-2 ${BODY}`}>
                  <Paragraphs text={c.text} />
                </div>
              )}
              {c.check && (
                <p className="mt-3 flex items-center gap-1.5 text-[14px] font-semibold text-cocoa">
                  <Check size={16} className="text-gold" strokeWidth={3} aria-hidden />
                  {c.check}
                </p>
              )}
            </div>
          ))}
        </div>
        </>
      );
    case "timeline":
      // Desktop: a thin honey line with small dots. Phones: plain stacked blocks.
      return (
        <>
        {b.title && <SubHeading text={b.title} />}
        <ol className="relative mt-8 flex flex-col gap-6 md:pl-8 md:before:absolute md:before:bottom-2 md:before:left-[3px] md:before:top-2 md:before:w-0.5 md:before:bg-gold">
          {b.items.map((s, i) => (
            <li key={i} className="relative break-inside-avoid">
              <span aria-hidden className="absolute -left-8 top-[0.55em] hidden h-2 w-2 rounded-full bg-gold md:block" />
              {s.label && <p className="text-[17px] font-bold text-cocoa md:text-[18px]">{s.label}</p>}
              <div className={`mt-1 ${BODY}`}>
                <Paragraphs text={s.text} />
              </div>
            </li>
          ))}
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
            <Link href={b.href} className="underline decoration-gold decoration-2 underline-offset-2 hover:text-cocoa">
              {b.label}
            </Link>
          </p>
        );
      }
      return <Button href={b.href} label={b.label} note={b.note} />;
    case "sources":
      if (!b.items.length) return null;
      // Collapsed under one small line, after the story is over (visual plan #7):
      // credibility for the sceptical reader, invisible to everyone else.
      return (
        <details className="mt-10 border-t border-line pt-5">
          <summary className={`cursor-pointer text-[14px] font-semibold ${MUTED} hover:text-cocoa`}>
            {b.title || "Sources"}
          </summary>
          <ol className={`mt-3 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed ${MUTED}`}>
            {b.items.map((x, i) => (
              <li key={i}>{withInline(x)}</li>
            ))}
          </ol>
        </details>
      );
    case "product": {
      const info = b.product ? products[b.product.handle] : undefined;
      const href = b.ctaHref || (b.product ? `/products/${b.product.handle}` : "");
      const image = b.image.src ? b.image : info?.image;
      return (
        // data-listicle-end: the floating button is gone from here on.
        <section data-listicle-end="" className="mt-10 break-inside-avoid rounded-lg bg-cream px-5 py-7 text-center md:p-8">
          {image && <Figure image={image} />}
          <h3 className="mt-6 font-display text-[26px] font-bold leading-tight text-cocoa md:text-[30px]">
            {b.name || info?.title || b.product?.title}
          </h3>
          {b.contents.length > 0 && (
            <div className="mx-auto mt-5 max-w-sm text-left">
              {b.contentsTitle && <p className="text-[15px] font-bold text-cocoa">{b.contentsTitle}</p>}
              <ul className="mt-2 space-y-1.5">
                {b.contents.map((c, i) => (
                  <li key={i} className={`flex gap-2 ${BODY} md:text-[17px]`}>
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
  // Reasons are numbered by order; the first one marks where the floating
  // button may start showing (data-listicle-start).
  const reasonNo: (number | null)[] = [];
  let count = 0;
  for (const s of l.sections) reasonNo.push(s.kind === "reason" ? ++count : null);
  const firstReason = reasonNo.findIndex((n) => n !== null);
  const byline = [l.byline.author, l.byline.date, l.byline.readTime].filter(Boolean).join(" · ");

  return (
    <article className="bg-paper pb-16 md:pb-24" style={{ "--hl": HIGHLIGHT_CSS[l.highlight] } as CSSProperties}>
      <header className={`${COLUMN} pt-6 md:pt-10`}>
        {l.topStrip && <p className={`text-[13px] font-semibold ${MUTED}`}>{l.topStrip}</p>}
        <h1 className="mt-6 font-display text-[32px] font-bold leading-[1.12] text-cocoa md:mt-8 md:text-[46px]">{l.headline}</h1>
        {l.subhead && <p className="mt-4 text-[18px] leading-snug text-brown md:text-[21px]">{withInline(l.subhead)}</p>}
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
        const first = i === firstReason;
        const gap = i === 0 ? "mt-12 md:mt-16" : "mt-20 md:mt-28";
        const inner = (
          <>
            {s.heading && (
              <h2
                {...(first ? { "data-listicle-start": "" } : {})}
                className={`font-display font-bold leading-tight text-cocoa ${s.kind === "intro" ? "text-[24px] md:text-[28px]" : "text-[26px] md:text-[34px]"}`}
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
            {s.kind === "reason" && <hr aria-hidden className="mx-auto mt-14 w-20 border-0 border-t-2 border-gold/70 md:mt-20" />}
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
