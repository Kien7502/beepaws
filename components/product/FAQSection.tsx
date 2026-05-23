"use client";

import { useState } from "react";
import { Plus, Shield, PawPrint, Volume2, Package, RefreshCw, type LucideIcon } from "lucide-react";
import type { FaqItem } from "@/types/metafields";

const ICON_MAP: Record<string, LucideIcon> = {
  Shield, PawPrint, Volume2, Package, RefreshCw,
};

const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    icon: "Shield",
    q: "Is it safe for my dog's teeth and gums?",
    a: "Yes — BeePaws uses gentle ultrasonic vibration calibrated for pet tooth enamel. The non-invasive tip won't scratch or damage gums when used as directed, and there's no anesthesia risk.",
  },
  {
    icon: "PawPrint",
    q: "What breeds and ages is it suitable for?",
    a: "BeePaws works for dogs of all breeds and sizes. We recommend starting once adult teeth are in (around 6 months). Senior dogs with heavy tartar buildup tend to see the biggest transformation.",
  },
  {
    icon: "Volume2",
    q: "Will the ultrasonic sound scare my pet?",
    a: "The frequency operates near the upper limit of human hearing, and most dogs habituate within the first 30 seconds — especially when paired with the included pet-safe dental gel as a positive reinforcement.",
  },
  {
    icon: "Package",
    q: "What's included in the box?",
    a: "You'll get the BeePaws ultrasonic scaler, 3 interchangeable tip sizes, a tube of pet-safe dental gel, a USB-C charging cable, and a travel pouch.",
  },
  {
    icon: "RefreshCw",
    q: "What if it doesn't work for my dog?",
    a: "We offer a 30-day no-questions-asked return policy. If you and your dog aren't happy with the results, just reach out and we'll make it right — simple and fair.",
  },
];

interface Props {
  items?: FaqItem[] | null;
}

export function FAQSection({ items }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const data = items && items.length > 0 ? items : DEFAULT_FAQ_ITEMS;

  // Warm Honey: cream bg, white question cards with hairline border. Per
  // reference: cocoa question text, gold-deep "+" that rotates to "x" on
  // open, brown answer text. Display serif on the heading.
  return (
    <section className="bg-cream py-14 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">

        <div className="mb-12 text-center">
          <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-gold-deep mb-2">
            Questions
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-cocoa leading-tight">
            Frequently asked
          </h2>
        </div>

        <div className="space-y-3">
          {data.map((faq, i) => {
            const Icon = ICON_MAP[faq.icon] ?? Shield;
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className="rounded-[13px] border border-line bg-card overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_20px_-10px_rgba(74,46,22,0.10)]"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <Icon className={`h-5 w-5 shrink-0 transition-colors duration-200 ${isOpen ? "text-clay" : "text-brown"}`} />
                  <span className="flex-1 font-extrabold text-cocoa">{faq.q}</span>
                  <Plus
                    className="h-5 w-5 shrink-0 text-gold-deep transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 pl-14 pr-5 text-[14.5px] leading-relaxed text-brown">
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
