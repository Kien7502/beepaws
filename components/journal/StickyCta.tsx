"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * The listicle's floating button (visual guide §7, option B): a small honey pill
 * fixed to the bottom of the screen. It appears once the reader reaches the first
 * reason, steps aside while one of the page's own buttons is on screen (two
 * buttons saying the same thing is noise), and is gone for good from the product
 * card on — the final call to action. Never more than 48px tall. Print: hidden.
 *
 * Markers come from ListicleView: `data-listicle-start` (first reason heading),
 * `data-listicle-cta` (every in-article button) and `data-listicle-end` (the
 * product card; without one, the last button counts as the end).
 */
export function StickyCta({ label, href }: { label: string; href: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const start = document.querySelector("[data-listicle-start]");
    const ctas = [...document.querySelectorAll("[data-listicle-cta]")];
    const end = document.querySelector("[data-listicle-end]") ?? ctas[ctas.length - 1] ?? null;
    if (!start) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const started = start.getBoundingClientRect().top < vh * 0.6;
      const ended = !!end && end.getBoundingClientRect().top < vh;
      const buttonOnScreen = ctas.some((c) => {
        const r = c.getBoundingClientRect();
        return r.bottom > 0 && r.top < vh;
      });
      setShow(started && !ended && !buttonOnScreen);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center bg-gradient-to-t from-paper/90 to-transparent px-4 pb-4 pt-6 transition-[opacity,transform] duration-300 motion-reduce:transition-none print:hidden ${
        show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <Link
        href={href}
        tabIndex={show ? 0 : -1}
        className={`inline-flex h-11 items-center rounded-full bg-gold px-6 text-[15px] font-bold text-cocoa shadow-[0_6px_18px_-6px_rgb(74_46_22/0.45)] transition-colors hover:bg-gold-deep ${
          show ? "pointer-events-auto" : ""
        }`}
      >
        {label}
      </Link>
    </div>
  );
}
