'use client';

import { useEffect } from 'react';

// Adds `.is-visible` to reveal elements as they scroll into view. Dependency-free
// (no view() timeline — Lightning CSS strips it — and no animation library). The
// page stays a server component; this mounts once and observes the server-rendered
// elements after hydration. CSS in globals.css owns the actual fade + rise.
//
// Two observers, because the two reveal styles want different trigger points:
//   • `.ds-reveal` / `.ds-stagger` (whole element fades) — trigger as it just
//     enters, so the motion reads while the section is arriving.
//   • `.ds-reveal-in` (background stays solid, only the inner content animates) —
//     trigger once the section's top clears the bottom ~28% of the viewport.
//     Tuned by bisection (2026-07-08): -40% (60% line) made fast scrollers
//     arrive and WAIT for the fade; -15% (85% line) finished the animation
//     before the section was properly in view. -28% ≈ the 72% line is the
//     middle. Durations live in globals.css and were tuned alongside.
export default function RevealObserver() {
  useEffect(() => {
    const early = Array.from(
      document.querySelectorAll<HTMLElement>('.ds-reveal, .ds-stagger'),
    );
    const late = Array.from(document.querySelectorAll<HTMLElement>('.ds-reveal-in'));
    if (early.length === 0 && late.length === 0) return;

    // Older browsers / SSR safety: just show everything.
    if (!('IntersectionObserver' in window)) {
      [...early, ...late].forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const reveal = (entry: IntersectionObserverEntry, obs: IntersectionObserver) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // reveal once, then stop watching
      }
    };

    const ioEarly = new IntersectionObserver(
      (entries, obs) => entries.forEach((e) => reveal(e, obs)),
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
    );
    early.forEach((el) => ioEarly.observe(el));

    // threshold 0 + a negative bottom margin fires the moment the element's
    // top edge crosses the (viewport * 0.72) line — height-independent, so it
    // behaves the same for short and tall sections.
    const ioLate = new IntersectionObserver(
      (entries, obs) => entries.forEach((e) => reveal(e, obs)),
      { threshold: 0, rootMargin: '0px 0px -28% 0px' },
    );
    late.forEach((el) => ioLate.observe(el));

    // Safety net: the late trigger needs a section's top to clear the bottom
    // ~28% of the viewport, which a very last section can't do if the footer
    // is short.
    // At the page bottom, reveal anything still hidden so content is never stuck.
    const onScrollBottom = () => {
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        document
          .querySelectorAll('.ds-reveal-in:not(.is-visible)')
          .forEach((el) => el.classList.add('is-visible'));
        window.removeEventListener('scroll', onScrollBottom);
      }
    };
    window.addEventListener('scroll', onScrollBottom, { passive: true });

    return () => {
      ioEarly.disconnect();
      ioLate.disconnect();
      window.removeEventListener('scroll', onScrollBottom);
    };
  }, []);

  return null;
}
