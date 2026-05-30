"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import type { Product, ProductVariant } from "@/types/shopify";
import type { BundleTierCopy } from "@/types/metafields";
import type { PaymentMethods } from "@/lib/shopify/queries";
import Button from "@/components/ui/Button";
import { CheckCircle2, Info, ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useProductMedia } from "./ProductMediaSync";
import { PaymentMethodsRow } from "./PaymentMethodsRow";

// Color name → hex map for swatch rendering. Falls back to text button when a
// value isn't recognized, so the picker degrades gracefully for unusual colors.
const COLOR_HEX: Record<string, string> = {
  white: "#FFFFFF",
  black: "#1A1A1A",
  pink: "#F4A6B8",
  rose: "#F4A6B8",
  red: "#E74C3C",
  green: "#7AB87A",
  blue: "#7BB7E0",
  yellow: "#F5C76B",
  orange: "#F5A53C",
  purple: "#A88AC9",
  gray: "#9CA3AF",
  grey: "#9CA3AF",
  brown: "#8B5E3C",
  beige: "#E8D9C0",
  cream: "#FFF5E4",
};

function isColorOption(name: string) {
  return name.toLowerCase().trim() === "color";
}

// Split a multi-color value string (e.g. "Red & Black", "Pink/White",
// "Red and Black"). Only splits on explicit separators so single names like
// "Pearl White" stay intact. Returns ["Pearl White"] for single-color values.
function parseColorValue(value: string): string[] {
  return value
    .split(/\s*[&/+]\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Look up the hex for a single color name. Tries the full string first, then
// each word in reverse so "Pearl White" → "white". Returns null when no match.
function getColorHex(value: string): string | null {
  const key = value.toLowerCase().trim();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  for (const word of key.split(/\s+/).reverse()) {
    if (COLOR_HEX[word]) return COLOR_HEX[word];
  }
  return null;
}

// Resolve a swatch's hex values. Returns null when any color in the value
// doesn't resolve — caller should fall back to a text chip.
function resolveSwatchColors(value: string): string[] | null {
  const names = parseColorValue(value);
  const hexes = names.map(getColorHex);
  if (hexes.some((h) => h === null)) return null;
  return hexes as string[];
}

// CSS background string for a swatch. Single color → solid. Two colors →
// diagonal split (Renoheal-style). 3+ → conic gradient with equal slices.
function swatchBackground(colors: string[]): string {
  if (colors.length === 1) return colors[0];
  if (colors.length === 2) {
    return `linear-gradient(to bottom right, ${colors[0]} 0%, ${colors[0]} 50%, ${colors[1]} 50%, ${colors[1]} 100%)`;
  }
  const stops = colors
    .map((c, i) => {
      const from = (i / colors.length) * 360;
      const to = ((i + 1) / colors.length) * 360;
      return `${c} ${from}deg ${to}deg`;
    })
    .join(", ");
  return `conic-gradient(${stops})`;
}

// Bundle tiers per Phase 3 Part B. Each tier composes a main-product quantity
// with optional cross-sell add-ons (referenced by index into addonProducts).
// Add-on indexes that don't resolve (e.g., addonProducts is empty) are silently
// skipped — the tier still works as a pure quantity bundle.
//
// IMPORTANT: tier totals here are raw sums (mainPrice * qty + addon prices).
// Visual "savings" tags are placeholders; actual checkout discounts must be
// configured as Shopify Automatic Discounts to take effect.
// Tier structure (mainQty + addonRefs + popular/bestValue flags) is fixed
// because the bundle UX depends on it. Names + descriptions are intentional
// Lorem ipsum placeholders so an unedited product reads as unedited — set
// the beepaws.bundle_tiers metafield to override per-product copy.
const TIERS = [
  {
    name: "Lorem ipsum tier 1",
    description: "Lorem ipsum dolor sit amet — placeholder tier description.",
    mainQty: 1,
    addonRefs: [] as { idx: number; qty: number }[],
  },
  {
    name: "Lorem ipsum tier 2",
    description: "Consectetur adipiscing elit — placeholder tier description.",
    mainQty: 1,
    addonRefs: [{ idx: 0, qty: 1 }],
    popular: true,
  },
  {
    name: "Lorem ipsum tier 3",
    description: "Sed do eiusmod tempor — placeholder tier description.",
    mainQty: 2,
    addonRefs: [{ idx: 1, qty: 1 }],
    bestValue: true,
  },
] as const;

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(amount);
}

function getPrimaryVariant(product: Product) {
  return product.variants.edges[0]?.node;
}

type Props = {
  product: Product;
  /** Pool of products eligible as cross-sell add-ons in higher tiers. Typically
   * supplied by the page as `recommendedBundleProducts` (collection siblings). */
  addonProducts?: Product[];
  /** Enabled payment methods from Shopify shop.paymentSettings. Drives the
   * badge row under the buy button. Falls back to nothing rendered when empty. */
  paymentMethods?: PaymentMethods;
  /** Short reassurance copy displayed directly above the CTA. Used to
   * pre-empt the most common refund reason ("I think it's broken") — for
   * the ultrasonic scaler, this is the "silent until tooth contact" note.
   * Comes from the `beepaws.education_note` metafield. */
  educationNote?: string | null;
  /** Per-tier copy overrides from the `beepaws.bundle_tiers` metafield.
   * Index 0 = Starter, 1 = Complete Care, 2 = Family Pack. Missing entries
   * or empty strings fall back to the in-code TIERS defaults so structure
   * (qty/addons/badges) stays separate from editable text. */
  bundleTiers?: BundleTierCopy[] | null;
};

export default function VariantSelector({
  product,
  addonProducts = [],
  paymentMethods = { cards: [], wallets: [] },
  educationNote,
  bundleTiers,
}: Props) {
  // Resolve tier copy: metafield wins when set, else default. We do this
  // here rather than mutating TIERS so the structural shape (and the
  // (typeof TIERS)[number] type used by resolveAddons) stays untouched.
  function tierCopy(i: number, field: "name" | "description"): string {
    const custom = bundleTiers?.[i]?.[field]?.trim();
    return custom || TIERS[i][field];
  }
  const variants = product.variants.edges.map((e) => e.node);
  const multi = variants.length > 1;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0]);
  // Default to the "Most Popular" tier (Complete Care Kit) — common conversion pattern.
  const [tierIdx, setTierIdx] = useState(1);

  // Derive the option structure from variants. Each entry is one Shopify option
  // (e.g. "Color", "Size") and its ordered unique values. When the merchant
  // splits a single combined option into multiple separate options in Shopify
  // Admin, this picker automatically renders one section per option — no code
  // change needed here.
  const optionGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const v of variants) {
      for (const opt of v.selectedOptions) {
        if (!map.has(opt.name)) map.set(opt.name, []);
        const arr = map.get(opt.name)!;
        if (!arr.includes(opt.value)) arr.push(opt.value);
      }
    }
    return Array.from(map.entries()).map(([name, values]) => ({ name, values }));
  }, [variants]);

  // Currently selected value per option name (derived from selectedVariant).
  const selectedOptionValues: Record<string, string> = Object.fromEntries(
    selectedVariant.selectedOptions.map((o) => [o.name, o.value]),
  );

  function pickOptionValue(name: string, value: string) {
    const next = { ...selectedOptionValues, [name]: value };
    const matched = matchVariantByOptions(next, name, value);
    if (matched) selectTopVariant(matched);
  }

  // Shared matcher used by both the top-level picker and the per-unit pickers
  // inside Family Pack. Tries an exact option-combination match first, falls
  // back to any variant containing the new option value (covers cases where
  // Shopify doesn't have every combination generated).
  function matchVariantByOptions(
    next: Record<string, string>,
    optName: string,
    optValue: string,
  ): ProductVariant | undefined {
    let matched = variants.find((v) =>
      v.selectedOptions.every((opt) => next[opt.name] === opt.value),
    );
    if (!matched) {
      matched = variants.find((v) =>
        v.selectedOptions.some((opt) => opt.name === optName && opt.value === optValue),
      );
    }
    return matched;
  }

  // Look up the selected option values for a specific unit's variant ID.
  function getUnitOptionValues(variantId: string): Record<string, string> {
    const v = variants.find((vv) => vv.id === variantId);
    if (!v) return {};
    return Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value]));
  }

  function pickUnitOptionValue(unitIdx: number, name: string, value: string) {
    const current = getUnitOptionValues(unitVariantIds[unitIdx] ?? "");
    const next = { ...current, [name]: value };
    const matched = matchVariantByOptions(next, name, value);
    if (matched) setUnitVariant(unitIdx, matched.id);
  }
  const [unitVariantIds, setUnitVariantIds] = useState<string[]>(
    Array(3).fill(variants[0]?.id ?? ""),
  );
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const { addItem, openDrawer } = useCart();
  // Destructure the stable setter so it can be a useEffect dep without firing
  // every time the parent's context value memo recreates (it would otherwise
  // ping-pong: user clicks gallery thumb → activeIndex changes → context value
  // changes → this effect re-runs → sets gallery back to current variant's
  // image → user's click is undone). The setter itself is identity-stable via
  // a ref inside ProductMediaSync, so depending on it is loop-free.
  const { setActiveByUrl, setActiveVariant } = useProductMedia();

  useEffect(() => {
    setActiveByUrl(selectedVariant?.image?.url ?? null);
    // Publish the selected variant's price + availability so DynamicHeroPrice
    // can re-render the hero price when the user picks a different variant.
    if (selectedVariant) {
      setActiveVariant({
        amount: selectedVariant.price.amount,
        currencyCode: selectedVariant.price.currencyCode,
        availableForSale: selectedVariant.availableForSale,
      });
    }
  }, [selectedVariant, setActiveByUrl, setActiveVariant]);

  const tier = TIERS[tierIdx];
  const currencyCode = selectedVariant?.price?.currencyCode || "USD";

  // Resolve tier's addon references to actual products + their primary variants.
  // Unresolvable indexes (out-of-range) drop out — keeps the tier valid even
  // when fewer add-on products are available than the tier expects.
  function resolveAddons(t: (typeof TIERS)[number]) {
    return t.addonRefs
      .map((ref) => {
        const p = addonProducts[ref.idx];
        if (!p) return null;
        const v = getPrimaryVariant(p);
        if (!v?.availableForSale) return null;
        return { product: p, variant: v, qty: ref.qty };
      })
      .filter((x): x is { product: Product; variant: ProductVariant; qty: number } => x !== null);
  }

  const resolvedAddons = resolveAddons(tier);
  const addonsTotal = resolvedAddons.reduce(
    (sum, a) => sum + parseFloat(a.variant.price.amount) * a.qty,
    0,
  );
  // Sum the actual variant prices for each unit in the bundle. For Family Pack
  // (mainQty=2), each unit can have its own variant picked inline → variants
  // may have different prices, so we can't just multiply unitPrice * mainQty.
  // For Starter Kit (mainQty=1), this collapses to selectedVariant.price.
  let mainTotal = 0;
  for (let i = 0; i < tier.mainQty; i++) {
    const vid = unitVariantIds[i] ?? selectedVariant.id;
    const v = variants.find((vv) => vv.id === vid) ?? selectedVariant;
    mainTotal += parseFloat(v.price.amount);
  }
  const totalPrice = mainTotal + addonsTotal;

  function selectTier(idx: number) {
    setTierIdx(idx);
    // Reset every unit slot to the current top-level variant so the per-unit
    // picker starts from a clean state. Without this, units 2+ keep their
    // initial-render variant even after the top picker has moved on, which
    // makes the displayed bundle total look wrong vs the visible unit pickers.
    const fallbackId = selectedVariant?.id ?? "";
    setUnitVariantIds((prev) => prev.map(() => fallbackId));
  }

  function selectTopVariant(variant: ProductVariant) {
    setSelectedVariant(variant);
    // Broadcast to every unit slot — top picker behaves as the "default for
    // all units in the bundle"; per-unit pickers still override individually.
    setUnitVariantIds((prev) => prev.map(() => variant.id));
  }

  function setUnitVariant(unitIdx: number, variantId: string) {
    setUnitVariantIds((prev) => {
      const next = [...prev];
      next[unitIdx] = variantId;
      return next;
    });
  }


  function onAddToCart() {
    if (!selectedVariant?.availableForSale) return;

    // Add main product units (with per-unit variant picks when applicable)
    const counts = new Map<string, number>();
    for (let i = 0; i < tier.mainQty; i++) {
      const vid = unitVariantIds[i] ?? selectedVariant.id;
      counts.set(vid, (counts.get(vid) ?? 0) + 1);
    }

    for (const [variantId, qty] of counts) {
      const v = variants.find((vv) => vv.id === variantId) ?? selectedVariant;
      addItem({
        merchandiseId: variantId,
        productHandle: product.handle,
        productTitle: product.title,
        variantTitle: v.title,
        imageUrl: product.images.edges[0]?.node?.url || "/product-placeholder.svg",
        currencyCode: v.price.currencyCode,
        unitPriceAmount: v.price.amount,
        quantity: qty,
      });
    }

    // Add resolved cross-sell add-ons for the selected tier
    for (const addon of resolvedAddons) {
      addItem({
        merchandiseId: addon.variant.id,
        productHandle: addon.product.handle,
        productTitle: addon.product.title,
        variantTitle: addon.variant.title,
        imageUrl: addon.product.images.edges[0]?.node?.url || "/product-placeholder.svg",
        currencyCode: addon.variant.price.currencyCode,
        unitPriceAmount: addon.variant.price.amount,
        quantity: addon.qty,
      });
    }

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  // Buy It Now — bypass the local cart and POST the current bundle composition
  // straight to /api/shopify/cart/checkout, then redirect to Shopify checkout.
  // Same pattern as BundleBuyCard.onBuyNow so behavior stays consistent.
  async function onBuyNow() {
    if (!selectedVariant?.availableForSale || buyingNow) return;
    setBuyingNow(true);
    try {
      const counts = new Map<string, number>();
      for (let i = 0; i < tier.mainQty; i++) {
        const vid = unitVariantIds[i] ?? selectedVariant.id;
        counts.set(vid, (counts.get(vid) ?? 0) + 1);
      }
      const lines: { merchandiseId: string; quantity: number }[] = [];
      for (const [merchandiseId, quantity] of counts) {
        lines.push({ merchandiseId, quantity });
      }
      for (const addon of resolvedAddons) {
        lines.push({ merchandiseId: addon.variant.id, quantity: addon.qty });
      }
      const res = await fetch("/api/shopify/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Couldn't open checkout");
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setBuyingNow(false);
    }
  }

  const isAvailable = selectedVariant?.availableForSale;

  return (
    <div className="flex flex-col gap-6">
      {/* No "Your selection" total here — the hero price row above shows the
          from-price, and the running total is baked into the Add-to-cart label
          below. One price on screen at a time per the device reference. */}

      {/* Variant pickers — one section per Shopify product option.
          Color options render as circular swatches (diagonal split for
          multi-color values); other options render as full-width stacked
          text buttons so longer phrases like "USB charger only" stay readable. */}
      {multi && optionGroups.map((opt) => {
        const colorMode = isColorOption(opt.name);
        const selectedValue = selectedOptionValues[opt.name];
        return (
          <div key={opt.name} className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-bold text-cocoa">{opt.name}</span>
              {colorMode && selectedValue && (
                <span className="text-brown">{selectedValue}</span>
              )}
            </div>
            <div className={colorMode ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
              {opt.values.map((value) => {
                const active = selectedValue === value;
                if (colorMode) {
                  const colors = resolveSwatchColors(value);
                  if (!colors) {
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => pickOptionValue(opt.name, value)}
                        title={value}
                        className={`min-h-[44px] rounded-xl border-[1.8px] px-4 py-2.5 text-sm font-bold transition-all ${
                          active
                            ? "border-clay bg-[#FCFBF4] text-cocoa shadow-sm"
                            : "border-line text-cocoa hover:border-clay/60"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => pickOptionValue(opt.name, value)}
                      title={value}
                      aria-label={value}
                      aria-pressed={active}
                      className={`relative flex h-12 w-12 items-center justify-center rounded-xl border-[1.8px] transition-all ${
                        active
                          ? "border-transparent bg-[#EFE6CF] ring-2 ring-clay"
                          : "border-line bg-[#EFE6CF] hover:border-clay/60"
                      }`}
                    >
                      <span
                        className="block h-8 w-8 rounded-full border border-black/25 shadow-[inset_0_-1px_2px_rgb(0_0_0_/_0.08)]"
                        style={{ background: swatchBackground(colors) }}
                      />
                    </button>
                  );
                }
                // Non-color option: full-width stacked button so longer values
                // (e.g. "USB charger only") read clearly one per line.
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => pickOptionValue(opt.name, value)}
                    className={`w-full min-h-[44px] rounded-xl border-[1.8px] px-4 py-2.5 text-left text-sm font-bold transition-all ${
                      active
                        ? "border-clay bg-[#FCFBF4] text-cocoa shadow-sm"
                        : "border-line text-cocoa hover:border-clay/60"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brown">
            Bundle &amp; Save
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="space-y-3">
          {TIERS.map((t, i) => {
            const selected = tierIdx === i;
            const tAddons = resolveAddons(t);
            // For the selected tier, use the actual per-unit picks (matches the
            // top-level "Your selection" total). For other tiers, the user
            // hasn't selected them yet, so default to selectedVariant × qty.
            let tMainTotal = 0;
            for (let u = 0; u < t.mainQty; u++) {
              const vid = selected
                ? unitVariantIds[u] ?? selectedVariant.id
                : selectedVariant.id;
              const v = variants.find((vv) => vv.id === vid) ?? selectedVariant;
              tMainTotal += parseFloat(v.price.amount);
            }
            const tTotal =
              tMainTotal +
              tAddons.reduce((sum, a) => sum + parseFloat(a.variant.price.amount) * a.qty, 0);

            return (
              <div
                key={t.name}
                onClick={() => selectTier(i)}
                className={`relative cursor-pointer rounded-[13px] border-[1.8px] py-3.5 pl-12 pr-4 transition-all ${
                  selected
                    ? "border-clay bg-[#FCFBF4] shadow-sm"
                    : "border-line bg-card hover:border-clay/60"
                }`}
              >
                {/* Radio: absolute, left-edge, vertically centered. Active state
                    uses a radial-gradient fill so the dot has a thin white ring
                    around the clay center, matching the reference template. */}
                <span
                  aria-hidden
                  className={`absolute left-4 top-1/2 h-[19px] w-[19px] -translate-y-1/2 rounded-full border-2 transition-all ${
                    selected ? "border-clay" : "border-[#cdc4a7] bg-white"
                  }`}
                  style={
                    selected
                      ? { background: "radial-gradient(circle, var(--color-clay) 0 44%, #fff 47%)" }
                      : undefined
                  }
                />

                {/* Floating flag — sits half-above the card border at top-right.
                    Clay for "Most Chosen", cocoa for "Best Value". */}
                {"popular" in t && t.popular && (
                  <span className="absolute -top-2.5 right-3.5 rounded-full bg-clay px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white">
                    Most Chosen
                  </span>
                )}
                {"bestValue" in t && t.bestValue && (
                  <span className="absolute -top-2.5 right-3.5 rounded-full bg-cocoa px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white">
                    Best Value
                  </span>
                )}

                {/* Title row: tier name + price on one baseline. Mixed case per
                    reference — no uppercase, the floating flag carries the
                    visual emphasis. */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[15.5px] font-bold text-cocoa">
                    {tierCopy(i, "name")}
                  </span>
                  <span className="text-[15.5px] font-bold tabular-nums text-cocoa">
                    {formatMoney(tTotal, currencyCode)}
                  </span>
                </div>

                <p className="mt-0.5 text-[12.5px] leading-snug text-brown">
                  {tierCopy(i, "description")}
                </p>

                {/* What's included — main qty + resolved addons with thumbnails.
                    Off-reference but kept because customers benefit from seeing
                    the actual items per tier, especially when add-ons differ. */}
                <ul className="mt-2 space-y-1 text-[12px] text-brown">
                  <li className="flex items-center gap-2">
                    <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-line bg-cream">
                      <Image
                        src={product.images.edges[0]?.node?.url || "/product-placeholder.svg"}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    </span>
                    <span className="min-w-0 truncate">
                      <span className="font-bold">{t.mainQty}×</span> {product.title}
                    </span>
                  </li>
                  {tAddons.map((a) => (
                    <li key={a.product.id} className="flex items-center gap-2">
                      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-line bg-cream">
                        <Image
                          src={a.product.images.edges[0]?.node?.url || "/product-placeholder.svg"}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="24px"
                        />
                      </span>
                      <span className="min-w-0 truncate">
                        <span className="font-bold">{a.qty}×</span> {a.product.title}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Per-unit pickers (Family Pack: pick color per device). Not in
                    the reference template but kept as a real feature for multi-
                    pet bundles — only renders when the user has selected this
                    tier AND it has more than one main unit. */}
                {selected && multi && t.mainQty > 1 && (
                  <div className="mt-3 space-y-3 border-t border-line pt-3">
                    {Array.from({ length: t.mainQty }, (_, j) => {
                      const uid = unitVariantIds[j] ?? variants[0]?.id ?? "";
                      const unitOpts = getUnitOptionValues(uid);
                      return (
                        <div key={j} className="space-y-1.5">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-brown">
                            Unit #{j + 1}
                          </p>
                          {optionGroups.map((opt) => {
                            const colorMode = isColorOption(opt.name);
                            const unitSelected = unitOpts[opt.name];
                            return (
                              <div key={opt.name} className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                                <span className="text-[11px] font-semibold text-brown">
                                  {opt.name}:
                                </span>
                                {opt.values.map((value) => {
                                  const active = unitSelected === value;
                                  if (colorMode) {
                                    const colors = resolveSwatchColors(value);
                                    if (colors) {
                                      return (
                                        <button
                                          key={value}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            pickUnitOptionValue(j, opt.name, value);
                                          }}
                                          title={value}
                                          aria-label={value}
                                          aria-pressed={active}
                                          className={`relative flex h-9 w-9 items-center justify-center rounded-lg border-[1.8px] bg-[#EFE6CF] transition-all ${
                                            active
                                              ? "border-transparent ring-2 ring-clay"
                                              : "border-line hover:border-clay/60"
                                          }`}
                                        >
                                          <span
                                            className="block h-6 w-6 rounded-full border border-black/25 shadow-[inset_0_-1px_2px_rgb(0_0_0_/_0.08)]"
                                            style={{ background: swatchBackground(colors) }}
                                          />
                                        </button>
                                      );
                                    }
                                  }
                                  // Non-color option, or unknown color → compact text chip
                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        pickUnitOptionValue(j, opt.name, value);
                                      }}
                                      className={`rounded-lg border-[1.8px] px-2.5 py-1 text-xs font-bold transition-all ${
                                        active
                                          ? "border-clay bg-[#FCFBF4] text-cocoa"
                                          : "border-line text-cocoa hover:border-clay/60"
                                      }`}
                                    >
                                      {value}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>

        {educationNote && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border-[1.8px] border-line bg-cream px-3 py-2.5 text-xs leading-relaxed text-brown">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden />
            <span>{educationNote}</span>
          </div>
        )}

        {/* id="sticky-cta-trigger" — StickyAddToCart watches THIS button's
            bottom edge (not a separate zero-height sentinel, which was
            unreliable: IntersectionObserver on a 0-height div reports
            isIntersecting:false constantly in some browsers and never fires
            callbacks after the initial one). Sticky reveals the moment this
            button's bottom passes viewport top — matches reference HTML's
            `addBtn.getBoundingClientRect().bottom < 0` check exactly. */}
        <Button
          id="sticky-cta-trigger"
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isAvailable}
          leftIcon={<ShoppingBag size={22} />}
          className="min-h-[52px] rounded-xl text-base md:text-lg !bg-gold !text-cocoa hover:!bg-gold-deep hover:!text-white"
          onClick={onAddToCart}
        >
          {isAvailable ? `Add to cart — ${formatMoney(totalPrice, currencyCode)}` : "Out of stock"}
        </Button>

        {/* Buy It Now — outline secondary CTA per device reference. Skips the
            local cart and goes straight to Shopify checkout with the current
            bundle composition. */}
        <button
          type="button"
          disabled={!isAvailable || buyingNow}
          onClick={onBuyNow}
          className="mt-2.5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border-[1.8px] border-cocoa bg-transparent px-4 py-2.5 text-base font-bold text-cocoa shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-cocoa hover:text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-transparent disabled:hover:text-cocoa disabled:hover:shadow-sm md:text-lg"
        >
          {buyingNow && <Loader2 size={18} className="animate-spin" />}
          {buyingNow ? "Opening checkout…" : "Buy it now"}
        </button>

        {/* Compact trust line — sits flush under the CTA at the decision moment. */}
        <p className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs font-medium text-brown">
          <span>30-day money-back</span>
          <span aria-hidden className="text-brown/40">·</span>
          <span>Free shipping over $50</span>
          <span aria-hidden className="text-brown/40">·</span>
          <span>Secure checkout</span>
        </p>

        {/* Payment processor badges — card brands + wallets. ShopPay button
            removed per redesign; ShopPay appears on the Shopify checkout
            page as an express-checkout option for users who use it. */}
        <PaymentMethodsRow methods={paymentMethods} />


        {added && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-emerald-600">
            <CheckCircle2 size={16} />
            Added to cart!{" "}
            <button
              type="button"
              onClick={openDrawer}
              className="underline underline-offset-2 hover:opacity-80"
            >
              View cart
            </button>
          </p>
        )}
      </div>
    </div>
  );
}