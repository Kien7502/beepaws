import Link from "next/link";
import type { ReactNode } from "react";
import { SimpleArticle } from "@/components/layout/SimpleArticle";

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
    a: <>We ship within the United States.</>,
  },
  {
    q: "How long does delivery take?",
    a: (
      <>
        Orders leave our warehouse within 1–3 business days, and most arrive about 5–9 days
        after that. You&apos;ll get an email with your tracking link as soon as yours ships.
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
        As soon as you order: it&apos;s in your order confirmation email, so you can read
        it before your plaque remover arrives.
      </>
    ),
  },
  {
    q: "Can I change or cancel my order?",
    a: (
      <>
        Get in touch as soon as you can. If your order hasn&apos;t shipped yet, we&apos;ll do
        our best to change or cancel it. Once it&apos;s on its way, our 60-day promise still
        covers you.
      </>
    ),
  },
  {
    q: "What if it doesn't work for my dog?",
    a: (
      <>
        Every order comes with our 60-day promise: if it&apos;s not right for you or your
        dog, return it for a full refund. See{" "}
        <Link href="/returns" className="font-semibold text-[var(--color-primary)] hover:underline">
          returns
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
