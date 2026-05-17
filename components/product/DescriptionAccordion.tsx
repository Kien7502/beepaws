"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TechSpec } from "@/types/metafields";

// Collapsible accordion near the buy box. Sections appear conditionally —
// only props with content render. Multiple sections can be open at once
// (Set, not single index). The grid-template-rows 0fr→1fr trick animates
// height smoothly without measuring DOM.

type Props = {
  descriptionHtml?: string | null;
  techSpecs?: TechSpec[] | null;
  ingredients?: string[] | null;
};

export function DescriptionAccordion({ descriptionHtml, techSpecs, ingredients }: Props) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const sections: { key: string; title: string }[] = [];
  if (descriptionHtml) sections.push({ key: "description", title: "Description" });
  if (techSpecs && techSpecs.length > 0) sections.push({ key: "specifications", title: "Specifications" });
  if (ingredients && ingredients.length > 0) sections.push({ key: "ingredients", title: "Ingredients" });
  if (sections.length === 0) return null;

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="mt-8 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
      {sections.map((s) => {
        const isOpen = openKeys.has(s.key);
        return (
          <div key={s.key}>
            <button
              onClick={() => toggle(s.key)}
              className="flex w-full items-center justify-between py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-base font-bold text-[var(--color-foreground)]">{s.title}</span>
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
                <div className="pb-6">
                  {s.key === "description" && descriptionHtml && (
                    <div
                      className="product-html space-y-3 text-sm leading-relaxed text-[var(--color-accent)]/75"
                      dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                  )}
                  {s.key === "specifications" && techSpecs && (
                    <dl className="grid grid-cols-1 gap-2">
                      {techSpecs.map((spec) => (
                        <div
                          key={spec.label}
                          className="grid gap-1 rounded-xl border border-[var(--color-border)]/70 px-4 py-2.5 sm:grid-cols-[160px_1fr] sm:items-start"
                        >
                          <dt className="text-sm font-semibold text-[var(--color-foreground)]">
                            {spec.label}
                          </dt>
                          <dd className="min-w-0 break-words text-sm text-[var(--color-text)]/80">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {s.key === "ingredients" && ingredients && (
                    <ul className="flex flex-wrap gap-2">
                      {ingredients.map((item) => (
                        <li
                          key={item}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text)]/80"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
