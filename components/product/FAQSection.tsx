"use client";

import { useState } from "react";
import { Plus, Shield, PawPrint, Volume2, Package, RefreshCw, type LucideIcon } from "lucide-react";
import type { FaqItem } from "@/types/metafields";

const ICON_MAP: Record<string, LucideIcon> = {
  Shield, PawPrint, Volume2, Package, RefreshCw,
};

// Lorem ipsum placeholders — set beepaws.faq_items to override. Icons stay
// distinct so each row reads as a different question visually.
const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    icon: "Shield",
    q: "Lorem ipsum dolor sit amet?",
    a: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    icon: "PawPrint",
    q: "Ut enim ad minim veniam?",
    a: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    icon: "Volume2",
    q: "Duis aute irure dolor?",
    a: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    icon: "Package",
    q: "Excepteur sint occaecat cupidatat?",
    a: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    icon: "RefreshCw",
    q: "Sed ut perspiciatis unde omnis?",
    a: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.",
  },
];

interface Props {
  items?: FaqItem[] | null;
  eyebrow?: string;
  heading?: string;
}

export function FAQSection({
  items,
  eyebrow = "Lorem ipsum",
  heading = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
}: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const data = items && items.length > 0 ? items : DEFAULT_FAQ_ITEMS;

  // Warm Honey: honey-tint section per reference. White question cards
  // with hairline border, cocoa question text, gold-deep "+" rotating on
  // open, brown answer text. Copy from device reference template.
  return (
    <section className="bg-sand py-14 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">

        <div className="mb-12 text-center">
          <span className="block text-xs font-bold uppercase tracking-[0.14em] text-gold-deep mb-2.5">
            {eyebrow}
          </span>
          <h2 className="font-display text-3xl md:text-[33px] font-semibold tracking-tight text-cocoa leading-tight">
            {heading}
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
