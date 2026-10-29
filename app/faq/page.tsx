import Link from "next/link";
import type { ReactNode } from "react";
import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { CANCEL_HOURS, HANDLING_DAYS, PROMISE_DAYS, SHIPS_TO, TRANSIT_DAYS, range } from "@/lib/store-policy";

export const metadata = {
  title: "FAQ | BeePaws",
  description: "Answers about orders, shipping, the Calm Start guide and returns.",
};

// Store-level questions only; product questions live in each product page's FAQ
// (authored in the admin). Facts match /shipping and /returns (launch prep,
// 2026-10-21) — the template text this replaced still called the site a demo.
const QUESTIONS: { q: string; a: ReactNode }[] = [
  {
    q: "Where do you ship?",
    a: <>We ship within the {SHIPS_TO.name}.</>,
  },
  {
    q: "How long does delivery take?",
    a: (
      <>
        Orders leave our warehouse within {range(HANDLING_DAYS)} business days, and most arrive
        about {range(TRANSIT_DAYS)} days after that. You&apos;ll get an email with your tracking link as soon as yours ships.
        More on the{" "}
        <Link href="/shipping" className="font-semibold text-[var(--color-primary)] hover:underline">
          shipping page
        </Link>
        .
      </>
    ),
  },
  {
    q: "When does my Calm Start guide arrive?",
    a: (
      <>
        When your order ships: it&apos;s in your shipping confirmation email, with your tracking
        link, so you can read it before your plaque remover arrives.
      </>
    ),
  },
  {
    q: "Can I change or cancel my order?",
    a: (
      <>
        You can cancel within {CANCEL_HOURS} hours of ordering for a full refund: use the button in
        your order confirmation email, or email us. Ordered the wrong color or kit? Cancel and place
        a new order in that time. After {CANCEL_HOURS} hours, your order is with our warehouse and
        can&apos;t be canceled.
      </>
    ),
  },
  {
    q: "What if it doesn't work for my dog?",
    a: (
      <>
        Our {PROMISE_DAYS}-day promise covers you: if it doesn&apos;t work for your dog, tell us what
        happened. We&apos;ll help first, and if it still isn&apos;t working, we&apos;ll refund you in full.
        See{" "}
        <Link href="/returns" className="font-semibold text-[var(--color-primary)] hover:underline">
          returns &amp; refunds
        </Link>
        .
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <SimpleArticle
      title="Frequently asked questions"
      description="Quick answers about orders, shipping and returns."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "FAQ" },
      ]}
    >
      <section className="space-y-8">
        {QUESTIONS.map(({ q, a }) => (
          <div key={q}>
            <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-2">{q}</h2>
            <p>{a}</p>
          </div>
        ))}
        <p>
          Something else?{" "}
          <Link href="/contact" className="font-semibold text-[var(--color-primary)] hover:underline">
            Ask us
          </Link>
          . A real person reads every message.
        </p>
      </section>
    </SimpleArticle>
  );
}
