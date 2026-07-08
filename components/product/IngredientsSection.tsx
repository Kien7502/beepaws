"use client";

import { useState } from "react";
import Image from "next/image";
import type { IngredientGroup } from "@/types/metafields";

// "What's inside" — the consumable counterpart to the device-only Mechanism
// section. It occupies the SAME slot (toffee band between the same two waves)
// so non-device PDPs keep the page's act-break rhythm. Layout is the
// Luna-Smoke pattern from the Shrine reference — ingredient entries FLANK the
// product image — which is also the same compositional grammar as the
// homepage's Option 6 pillars, so the two surfaces stay one family. The
// center image is the product's own Shopify photo: no new photography needed.
//
// Read-the-label transparency (brand pillar 2) is the whole point: every
// ingredient in plain English with what it's there for. Multi-formula
// products (the dental spray's Unflavored vs Beef) author one group per
// formula; the toggle switches groups LOCALLY — deliberately NOT synced to
// the hero's variant picker: the label-reader compares formulas before
// choosing, synced state four screens from the picker is a recall trap, and
// the page stays statically renderable.
//
// ProductPageView gates the section on authored content (like
// ProductDetailsSections) — no lorem band for products that never author
// ingredients. The heading/lead defaults below are lorem per the codebase
// convention, overridable via beepaws.ingredients_intro.

interface ParsedItem {
  name: string;
  why?: string;
}

// "Name — what it's for" → { name, why }. Splits only on a SPACED dash
// (em/en/hyphen) so hyphenated ingredient names survive; a line without a
// dash renders name-only.
function parseItems(items?: string): ParsedItem[] {
  if (!items) return [];
  return items
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+[—–-]\s+/);
      return {
        name: parts[0].trim(),
        why: parts.slice(1).join(" — ").trim() || undefined,
      };
    });
}

interface Props {
  groups?: IngredientGroup[] | null;
  /** Legacy `beepaws.ingredients` flat list — rendered as a single unlabeled
   *  group when `groups` is unset. */
  legacyIngredients?: string[] | null;
  imageUrl: string;
  imageAlt: string;
  heading?: string;
  lead?: string;
}

export function IngredientsSection({
  groups,
  legacyIngredients,
  imageUrl,
  imageAlt,
  heading = "Lorem ipsum dolor sit amet, consectetur.",
  lead = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
}: Props) {
  const resolved = (
    groups && groups.length > 0
      ? groups
      : legacyIngredients && legacyIngredients.length > 0
        ? [{ items: legacyIngredients.join("\n") }]
        : []
  )
    .map((g) => ({ label: g.label?.trim() ?? "", items: parseItems(g.items) }))
    .filter((g) => g.items.length > 0);

  const [active, setActive] = useState(0);
  if (resolved.length === 0) return null;

  const group = resolved[Math.min(active, resolved.length - 1)];
  const split = Math.ceil(group.items.length / 2);
  const left = group.items.slice(0, split);
  const right = group.items.slice(split);

  const renderItem = (it: ParsedItem, i: number) => (
    <li key={`${it.name}-${i}`}>
      <h3 className="font-display text-lg font-semibold text-cocoa md:text-[19px]">
        {it.name}
      </h3>
      {it.why && (
        <p className="mt-1 text-[14.5px] leading-relaxed text-brown">{it.why}</p>
      )}
    </li>
  );

  return (
    <section className="ds-reveal-in bg-toffee py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="font-display mx-auto mb-3 max-w-3xl text-center text-3xl font-semibold leading-tight tracking-tight text-cocoa md:text-[33px]">
          {heading}
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-base text-brown md:mb-10">
          {lead}
        </p>

        {/* Formula toggle — only for multi-formula products. Plain toggle
            buttons (aria-pressed), not the tabs pattern: two pills don't need
            roving-arrow-key semantics. */}
        {resolved.length > 1 && (
          <div
            className="mb-10 flex flex-wrap items-center justify-center gap-2"
            role="group"
            aria-label="Choose a formula to read its ingredients"
          >
            {resolved.map((g, i) => (
              <button
                key={g.label || i}
                type="button"
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                  i === active
                    ? "bg-cocoa text-cream"
                    : "border border-line bg-card text-cocoa hover:border-clay/60"
                }`}
              >
                {g.label || `Formula ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Luna-Smoke flank layout: product photo center, ingredients either
            side. Mobile: image first, then the lists stacked. */}
        <div className="grid items-center gap-x-8 gap-y-8 md:grid-cols-[5fr_4fr_5fr] lg:gap-x-10">
          <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-card md:col-start-2 md:row-start-1 md:max-w-none">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <ul className="flex flex-col gap-7 md:col-start-1 md:row-start-1">
            {left.map(renderItem)}
          </ul>
          {right.length > 0 && (
            <ul className="flex flex-col gap-7 md:col-start-3 md:row-start-1">
              {right.map(renderItem)}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
