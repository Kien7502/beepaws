"use client";

import { useState } from "react";
import { Plus, Shield, PawPrint, Volume2, Package, RefreshCw } from "lucide-react";

const FAQS = [
  {
    icon: Shield,
    q: "Is it safe for my pet?",
    a: "Yes — BeePaws is designed specifically for at-home pet grooming. The rounded blade tips and protective guard prevent accidental nicks, making it safe even for wiggly pets.",
  },
  {
    icon: PawPrint,
    q: "What breeds is it suitable for?",
    a: "BeePaws works on all coat types — short, medium, and long hair for both dogs and cats. The adjustable guard combs let you choose the trim length that suits your breed.",
  },
  {
    icon: Volume2,
    q: "How loud is it? Will it scare my pet?",
    a: "Our motor runs at under 50dB — quieter than a normal conversation. Most pets barely notice it, even on the first use.",
  },
  {
    icon: Package,
    q: "What's included in the box?",
    a: "You'll get the BeePaws grooming unit, 4 guard combs (3mm, 6mm, 9mm, 12mm), a cleaning brush, a USB charging cable, and a storage pouch.",
  },
  {
    icon: RefreshCw,
    q: "What if it doesn't work for my pet?",
    a: "We offer a 30-day no-questions-asked return policy. If you and your pet aren't happy, just reach out and we'll sort it out — simple and fair.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-[var(--background)] py-14 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">

        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[var(--color-foreground)] leading-tight">
            Frequently Asked
          </h2>
          <span className="mt-2 inline-block rounded-xl bg-[var(--color-primary)] px-6 py-1.5 text-4xl md:text-5xl font-black uppercase tracking-tight text-[#3d2400]">
            Questions
          </span>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const Icon = faq.icon;
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className={`rounded-2xl border border-dashed overflow-hidden transition-colors duration-200 ${isOpen ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] bg-[var(--color-secondary)]/40"}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <Icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ${isOpen ? "text-[var(--color-primary)]" : "text-[var(--color-accent)]"}`} />
                  <span className="flex-1 font-bold text-[var(--color-foreground)]">{faq.q}</span>
                  <Plus
                    className="h-5 w-5 shrink-0 text-[var(--color-accent)] transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pl-14 pr-5 text-sm leading-relaxed text-[var(--color-accent)]/80">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
