import { Cookie, Mail, Sofa } from "lucide-react";
import type { CalmStartDay, CalmStartIntro } from "@/types/metafields";
import { contentIcon } from "@/lib/content-icons";
import { keepHyphenated, withAccent, withBold } from "@/lib/inline-format";

/**
 * The Calm Start Protocol (PDP revision doc 2026-10-05 §3): a 3-day routine
 * that introduces the device on the dog's terms. It answers "my dog won't sit
 * still for this" — the #1 purchase objection and the #1 return reason — so it
 * sits right after How it works, whose callout is about the first use.
 *
 * Laid out as a journey, not an article (owner, 2026-10-13: the first cut —
 * centred text over three equal cards — read "bland, like a boring article"):
 * the pitch on the left, and on the right a timeline whose stops are the days
 * (each with an icon and a short "dose" that grows: 1 tooth → half the mouth)
 * and whose last stop is the closing line — the goal the routine leads to.
 * On phones the same parts stack: pitch, timeline, then the email guide.
 *
 * Authored in the admin (beepaws.calm_start_intro + beepaws.calm_start_days).
 * No placeholder copy: with neither a heading nor a day, nothing renders.
 * Server component — contentIcon is server-only.
 */
export function CalmStart({
  intro,
  days,
}: {
  intro?: CalmStartIntro | null;
  days?: CalmStartDay[] | null;
}) {
  const heading = intro?.heading?.trim();
  const steps = (days ?? []).filter((d) => d?.title?.trim() || d?.body?.trim());
  if (!heading && steps.length === 0) return null;

  // Blank line = new paragraph, like the paradox body.
  const paragraphs = (intro?.lead ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const closing = intro?.closing?.trim();
  const emailNote = intro?.emailNote?.trim();

  return (
    <section className="ds-reveal-in bg-cream py-14 md:py-20">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-[auto_1fr] md:gap-x-14 md:gap-y-8 md:px-6">
        {/* The pitch — top left on desktop, first on phones. */}
        <div className="md:col-start-1 md:row-start-1">
          {heading && (
            <h2 className="type-h2 mb-4 text-cocoa">
              {withAccent(heading)}
            </h2>
          )}
          {paragraphs.map((p, i) => (
            <p key={i} className="type-body mb-3 text-brown">
              {withBold(p)}
            </p>
          ))}
        </div>

        {/* The journey — right column on desktop (spans both rows). */}
        {(steps.length > 0 || closing) && (
          <ol className="relative md:col-start-2 md:row-span-2 md:row-start-1">
            {steps.map((d, i) => {
              const Icon = contentIcon(d.icon, Cookie);
              // The path to the NEXT stop: a segment from under this marker to
              // the bottom of this row, where the next marker starts. Drawn per
              // row (not one line for the list) so it ends exactly at the last
              // stop instead of running past it. Warms from gold to clay-deep.
              const hasNext = i < steps.length - 1 || !!closing;
              const segment = ["from-gold to-amber", "from-amber to-clay", "from-clay to-clay-deep"][Math.min(i, 2)];
              return (
                <li key={i} className="relative flex gap-4 pb-5">
                  {hasNext && (
                    <span
                      aria-hidden
                      className={`absolute bottom-0 left-[21px] top-11 w-[3px] bg-gradient-to-b ${segment}`}
                    />
                  )}
                  <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-clay-deep shadow-[0_2px_10px_-4px_rgba(74,46,22,0.35)] ring-2 ring-gold">
                    <Icon size={20} strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl bg-card p-5 shadow-[0_4px_20px_-10px_rgba(74,46,22,0.12)] md:p-6">
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="type-label font-extrabold text-clay-deep">Day {i + 1}</span>
                      {d.dose?.trim() && (
                        <span className="rounded-full bg-honey-tint px-2.5 py-0.5 text-xs font-semibold text-cocoa">
                          {keepHyphenated(d.dose.trim())}
                        </span>
                      )}
                    </div>
                    {d.title?.trim() && (
                      <h3 className="type-title mb-1.5 text-cocoa">{d.title.trim()}</h3>
                    )}
                    {d.body?.trim() && (
                      <p className="type-card text-brown">{withBold(d.body.trim())}</p>
                    )}
                  </div>
                </li>
              );
            })}
            {/* The goal — the closing line as the last stop, in the dark
                finale card the page uses for its callouts. */}
            {closing && (
              <li className="relative flex gap-4">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-deep text-cream shadow-[0_2px_10px_-4px_rgba(74,46,22,0.45)]">
                  <Sofa size={20} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 rounded-2xl bg-cocoa p-5 md:p-6">
                  <p className="type-title text-cream">
                    {keepHyphenated(closing)}
                  </p>
                </div>
              </li>
            )}
          </ol>
        )}

        {/* The email guide — under the pitch on desktop, last on phones. */}
        {emailNote && (
          // self-end: on desktop it sits level with the timeline's finale, so
          // the left column doesn't leave its bottom half empty.
          <div className="flex items-start gap-3.5 rounded-2xl bg-honey-tint p-5 md:col-start-1 md:row-start-2 md:self-end">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-clay-deep">
              <Mail size={18} aria-hidden />
            </span>
            <p className="type-small text-cocoa">{keepHyphenated(emailNote)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
