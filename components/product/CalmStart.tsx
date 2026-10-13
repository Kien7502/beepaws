import { Mail } from "lucide-react";
import type { CalmStartDay, CalmStartIntro } from "@/types/metafields";
import { keepHyphenated, withAccent, withBold } from "@/lib/inline-format";

/**
 * The Calm Start Protocol (PDP revision doc 2026-10-05 §3): a 3-day routine
 * that introduces the device on the dog's terms. It answers "my dog won't sit
 * still for this" — the #1 purchase objection and the #1 return reason — so it
 * sits right after How it works, whose callout is about the first use.
 *
 * Authored in the admin (beepaws.calm_start_intro + beepaws.calm_start_days).
 * No placeholder copy: with neither a heading nor a day, the section is not
 * rendered at all, so a product without a protocol never shows an empty band.
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
    <section className="ds-reveal-in bg-cream pb-10 pt-14 md:pb-14 md:pt-20">
      <div className="container mx-auto max-w-5xl px-4 md:px-6">
        {heading && (
          <h2 className="font-display mx-auto mb-4 max-w-3xl text-center text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
            {withAccent(heading)}
          </h2>
        )}
        {paragraphs.map((p, i) => (
          <p key={i} className="mx-auto mb-3 max-w-2xl text-center text-base leading-relaxed text-brown">
            {withBold(p)}
          </p>
        ))}

        {steps.length > 0 && (
          // A sequence, so an ordered list: stacked on phones (Day 1 → 2 → 3
          // reads top to bottom), three across from md up.
          <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {steps.map((d, i) => (
              <li
                key={i}
                className="rounded-2xl bg-card p-6 shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)] md:p-7"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-clay-deep">Day {i + 1}</p>
                {d.title?.trim() && (
                  <h3 className="font-display mb-2 mt-1.5 text-lg font-semibold text-cocoa">{d.title.trim()}</h3>
                )}
                {d.body?.trim() && (
                  <p className="text-[15px] leading-relaxed text-brown">{withBold(d.body.trim())}</p>
                )}
              </li>
            ))}
          </ol>
        )}

        {closing && (
          <p className="font-display mx-auto mt-10 max-w-2xl text-center text-xl font-semibold leading-snug text-cocoa md:text-2xl">
            {keepHyphenated(closing)}
          </p>
        )}
        {emailNote && (
          // Icon inline at the start of the text, so it stays with the first
          // word in a centred, wrapping note (a flex row left it stranded).
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-brown">
            <Mail size={16} className="-mt-0.5 mr-1.5 inline-block align-middle text-clay-deep" aria-hidden />
            {keepHyphenated(emailNote)}
          </p>
        )}
      </div>
    </section>
  );
}
