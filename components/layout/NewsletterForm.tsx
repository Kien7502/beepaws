"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

// The footer's sign-up (2026-10-26; it used to be a button wired to nothing).
// Posts to /api/newsletter, which saves the address as a Shopify customer with
// email-marketing consent. "company" is a honeypot: hidden from people and
// screen readers, filled in only by bots.
export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), company: data.get("company") }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setStatus("done");
        return;
      }
      setError(json.error || "We couldn't sign you up just now. Please try again later.");
    } catch {
      setError("We couldn't sign you up just now. Please try again later.");
    }
    setStatus("idle");
  }

  if (status === "done") {
    return (
      <p className="max-w-sm text-cream/90" role="status">
        Thanks, you&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <div className="flex w-full gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email"
          className="w-full rounded-full border-2 border-white/15 bg-white/8 px-5 py-3 text-white placeholder-white/55 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/25 transition-all font-medium"
        />
        <input
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-full bg-gold px-5 py-3 font-bold text-cocoa transition-colors hover:bg-gold-deep disabled:opacity-70"
        >
          {status === "sending" ? "Sending…" : "Subscribe"}
        </button>
      </div>
      <p className="mt-2 min-h-5 text-sm text-gold" aria-live="polite">
        {error}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-cream/60">
        Occasional emails from BeePaws. Unsubscribe anytime. See our{" "}
        <Link href="/policies/privacy-policy" className="underline hover:text-gold">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
