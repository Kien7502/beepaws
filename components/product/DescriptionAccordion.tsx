"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DescriptionSection } from "@/lib/shopify/parse-description-sections";

type Props = {
  sections: DescriptionSection[];
};

export function DescriptionAccordion({ sections }: Props) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  if (sections.length === 0) return null;

  function toggle(i: number) {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="mt-10 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
      {sections.map((section, i) => {
        const isOpen = openIndices.has(i);
        return (
          <div key={section.heading}>
            <button
              onClick={() => toggle(i)}
              className="flex w-full items-center justify-between py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-base font-bold text-[var(--color-foreground)]">
                {section.heading}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-[var(--color-foreground)] transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
              suppressHydrationWarning
            >
              <div className="overflow-hidden" suppressHydrationWarning>
                <div
                  className="product-html pb-6 text-sm"
                  dangerouslySetInnerHTML={{ __html: section.html }}
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
