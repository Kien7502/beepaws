'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Scroll-triggered newsletter popup (consolidated spec §5). Replaces the old
// inline newsletter section. Fires ONCE at ~85% scroll, easy to dismiss, and
// remembers the dismissal for the current SESSION only (sessionStorage) - it
// does not re-fire on scroll within the session, but shows again on a fresh
// visit (new tab/window). Not time-based, not exit-intent. Passive footer
// subscribe still exists.
const DISMISS_KEY = 'beepaws_nl_popup_v1';

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // drives the enter/exit transition

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    let fired = false;
    const onScroll = () => {
      const reached =
        (window.scrollY + window.innerHeight) /
          document.documentElement.scrollHeight >=
        0.85;
      if (reached && !fired) {
        fired = true;
        setOpen(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Once mounted, flip `shown` on the next frame so the entrance transition
  // (slide-up + fade) plays from the hidden start state instead of snapping.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  function dismiss() {
    setShown(false); // animate out first
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode - popup just won't persist dismissal */
    }
    window.setTimeout(() => setOpen(false), 320); // unmount after the 300ms exit
  }

  if (!open) return null;

  return (
    <div
      className={`fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-2xl border border-line bg-paper p-6 shadow-[0_20px_50px_-20px_rgba(74,46,22,0.45)] transition-[opacity,transform] ease-[cubic-bezier(0.23,1,0.32,1)] md:right-6 md:left-auto md:mx-0 ${shown ? "translate-y-0 opacity-100 duration-[600ms]" : "translate-y-4 opacity-0 duration-300"}`}
      role="dialog"
      aria-label="Newsletter signup"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-brown transition-colors hover:bg-honey-tint hover:text-cocoa"
      >
        <X size={18} strokeWidth={2} />
      </button>

      <h2 className="font-display text-xl font-semibold leading-tight text-cocoa">
        Get 15% off your first order
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-brown">
        Then one email a month. No spam, no daily deals.
      </p>

      <form
        className="mt-4 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          dismiss();
        }}
      >
        <input
          type="email"
          required
          placeholder="you@example.com"
          className="h-11 w-full rounded-full border border-cocoa/15 bg-card px-4 text-sm font-medium text-cocoa outline-none placeholder:text-brown/50 focus:border-clay focus:ring-2 focus:ring-clay/20"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-clay px-6 text-sm font-bold text-white transition-colors hover:bg-cocoa active:scale-[0.97]"
        >
          Get my code
        </button>
      </form>
    </div>
  );
}
