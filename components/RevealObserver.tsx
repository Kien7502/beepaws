'use client';

import { useEffect } from 'react';

// Adds `.is-visible` to every `.ds-reveal` element the first time it scrolls
// into view. A reliable, dependency-free scroll reveal — no view() timeline
// (Lightning CSS strips it) and no animation library. The page stays a server
// component; this mounts once and observes the server-rendered sections after
// hydration. CSS in globals.css owns the actual fade + rise.
export default function RevealObserver() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('.ds-reveal, .ds-stagger'),
    );
    if (els.length === 0) return;

    // Older browsers / SSR safety: just show everything.
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target); // reveal once, then stop watching
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
