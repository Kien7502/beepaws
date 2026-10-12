"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { Product, ProductVariant } from "@/types/shopify";
import type { BundleTierCopy } from "@/types/metafields";
// Type-only import: the module itself is server-only, but `import type` is
// fully erased at compile time so nothing server-side reaches the client.
import type { SellingPlanOption } from "@/lib/shopify/selling-plans";
import Button from "@/components/ui/Button";
import { CheckCircle2, Info, ShoppingBag, Loader2, Minus, Plus } from "lucide-react";
import { useCart, type LocalCartItem } from "@/components/cart/CartProvider";
import { useProductMedia } from "./ProductMediaSync";
import { usePublishBuyBox } from "./BuyBoxSync";

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

// TIERS (owner, 2026-10-11): a pricing tier is a real Shopify bundle or the
// product alone — nothing is composed or invented here any more. The old
// code-defined fallback (device + whatever add-ons the collection offered) is
// what made every tier look set up when none was: in October all three flagship
// tiers silently ran on it.
//   - WITH a bundle link: sells that bundle, when the page could resolve it as
//     sellable on the storefront; otherwise the tier is HIDDEN, never faked.
//   - WITHOUT a link: the FIRST such tier sells this product alone (×1, the
//     picked variant). Any later unlinked tier is a kit not set up yet: hidden.
// Copy (name, description, badge) comes from beepaws.bundle_tiers.

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
  }).format(amount);
}

export type TierBundleVariant = {
  id: string;
  priceAmount: string;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
};
// A bundle linked from a tier (`beepaws.bundle_tiers[i].bundle`), resolved by the
// page. A customer-choose bundle is a normal multi-variant product, so we carry
// ALL its variants (picked inline in the tier) + its components (shown as
// "what's included"). Add / Buy adds the CHOSEN bundle variant (one line; Shopify
// expands it at checkout).
export type TierBundle = {
  handle: string;
  title: string;
  currencyCode: string;
  imageUrl: string;
  components: { quantity: number; title: string; handle: string; imageUrl: string | null }[];
  variants: TierBundleVariant[];
};

/** One option in a variant group (combined listing): a SEPARATE Shopify
 * product presented as a flavour/scent choice on this page. Each member keeps
 * its own price, images, variants and availability — nothing is shared.
 * `label` comes from the metafield, never the Shopify title (HyperSKU
 * overwrites titles on sync). */
export type VariantGroupOption = {
  handle: string;
  label: string;
  product: Product;
  availableForSale: boolean;
};

/** Tier gift, resolved + VERIFIED by the page: only present when the gift is
 * sellable AND the "BeePaws Tier Gift" discount actively backs it — the
 * discount is what makes the line free, the storefront just adds it. */
export type TierGift = {
  handle: string;
  title: string;
  imageUrl: string;
  variantId: string;
  priceAmount: string;
  currencyCode: string;
};

type CheckoutLine = { merchandiseId: string; quantity: number; sellingPlanId?: string };

type Props = {
  product: Product;
  /** Enabled payment methods from Shopify shop.paymentSettings. Drives the
   * badge row under the buy button. Falls back to nothing rendered when empty. */
  /** Short reassurance copy displayed directly above the CTA. Used to
   * pre-empt the most common refund reason ("I think it's broken") — for
   * the ultrasonic scaler, this is the "silent until tooth contact" note.
   * Comes from the `beepaws.education_note` metafield. */
  educationNote?: string | null;
  /** The `beepaws.bundle_tiers` metafield: one entry per pricing tier (name,
   * description, badge, bundle link, gift). No tiers = quantity mode. */
  bundleTiers?: BundleTierCopy[] | null;
  /** Per-tier resolved bundle (aligned by index with bundleTiers). When the
   * selected tier has one, Add/Buy adds the bundle product instead of items. */
  tierBundles?: (TierBundle | null)[] | null;
  /** Per-tier verified free gift (aligned by index). Selecting the tier adds
   * the gift line; the backing discount zeroes it in cart + checkout. */
  tierGifts?: (TierGift | null)[] | null;
  /** Subscribe & Save selling plans (Shopify Subscriptions app), resolved
   * server-side. Renders the purchase-option radio in quantity mode. */
  sellingPlans?: SellingPlanOption[] | null;
  /** Variant group (combined listing) members incl. this product, in display
   * order. Picking one switches which PRODUCT the buy box sells. */
  variantGroup?: VariantGroupOption[] | null;
  /** Picker label for the group ("Flavor", "Scent"). */
  variantGroupLabel?: string | null;
};

export default function VariantSelector({
  product,
  educationNote,
  bundleTiers,
  tierBundles,
  tierGifts,
  sellingPlans,
  variantGroup,
  variantGroupLabel,
}: Props) {
  // VARIANT GROUP (combined listing): the picked member decides which PRODUCT
  // this buy box sells. Everything below reads `activeProduct`, never the
  // `product` prop, so price, variants, images and the cart line all follow
  // the choice. Members are independent products — nothing is shared.
  const groupOptions = variantGroup?.length ? variantGroup : null;
  const [groupHandle, setGroupHandle] = useState<string>(product.handle);
  const activeGroupOption =
    groupOptions?.find((o) => o.handle === groupHandle) ?? groupOptions?.[0] ?? null;
  const activeProduct = activeGroupOption?.product ?? product;

  const variants = activeProduct.variants.edges.map((e) => e.node);
  const multi = variants.length > 1;

  // Variant identity is held as an ID, not an object: when the group member
  // changes, the old ID stops resolving and the selection falls back to the
  // new product's first variant automatically — no reset effect needed.
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id ?? "");
  const selectedVariant: ProductVariant =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const setSelectedVariant = (v: ProductVariant) => setSelectedVariantId(v.id);
  // The tiers that can actually be sold, in metafield order (the rule is at
  // the top of the file). `i` stays the metafield index so copy and gifts
  // line up.
  type TierView = { i: number; kind: "bundle"; bundle: TierBundle } | { i: number; kind: "single" };
  const tierViews: TierView[] = [];
  let singleTaken = false;
  (bundleTiers ?? []).forEach((t, i) => {
    if (t?.bundle?.handle) {
      const b = tierBundles?.[i];
      if (b) tierViews.push({ i, kind: "bundle", bundle: b });
    } else if (!singleTaken) {
      singleTaken = true;
      tierViews.push({ i, kind: "single" });
    }
  });
  // A choice only when there's more than one tier to pick from; otherwise the
  // colour picker and the button are the whole buy box.
  const showTierChoice = tierViews.length > 1;
  function tierName(view: TierView) {
    return (
      bundleTiers?.[view.i]?.name?.trim() ||
      (view.kind === "bundle" ? view.bundle.title : activeProduct.title)
    );
  }

  // Complete Care (tier index 1) is the pre-selected tier (PDP revision
  // 2026-10-05); when it isn't visible, the first tier that is.
  const defaultTier = tierViews.find((v) => v.i === 1) ?? tierViews[0] ?? null;
  const [tierIdx, setTierIdx] = useState(defaultTier?.i ?? 0);
  // A bundle tier's chosen variant (a customer-choose bundle is a normal
  // multi-variant product). Reset when the tier changes.
  const [bundleVariantId, setBundleVariantId] = useState<string | null>(() =>
    defaultTier?.kind === "bundle" ? (defaultTier.bundle.variants[0]?.id ?? null) : null,
  );

  // QUANTITY MODE (owner decision 2026-07-10): a product with NO tiers (the
  // consumables, e.g. the spray) has no tier cards — every variant gets its own
  // quantity stepper instead (2× Beef + 1× Unflavored in one add). The rows
  // replace the option picker too: a row IS the option.
  const quantityMode = !(bundleTiers?.length ?? 0);
  const [variantQtys, setVariantQtys] = useState<Record<string, number>>(() => {
    const first = product.variants.edges[0]?.node;
    return first ? { [first.id]: 1 } : {};
  });
  // Switching group member: sell the new product, and seed its first variant
  // at qty 1 so the CTA is never "Choose a quantity above" right after a pick.
  function selectGroupMember(option: VariantGroupOption) {
    if (option.handle === groupHandle) return;
    setGroupHandle(option.handle);
    const first = option.product.variants.edges[0]?.node;
    setSelectedVariantId(first?.id ?? "");
    setVariantQtys(first ? { [first.id]: 1 } : {});
    // The gallery is ONE combined reel of every member's images (built server-
    // side), so switching flavour just scrolls to this member's first image —
    // no set-swap, no reload flash. But if the reel is ALREADY on one of this
    // member's images (the user scrolled there), scrolling to its first image
    // would be a redundant jump/flicker — so skip it and leave the gallery put.
    const memberUrls = new Set(option.product.images.edges.map((e) => e.node.url));
    if (!activeUrl || !memberUrls.has(activeUrl)) {
      setActiveByUrl(option.product.images.edges[0]?.node?.url ?? null);
    }
  }
  function setVariantQty(id: string, qty: number) {
    setVariantQtys((prev) => ({ ...prev, [id]: Math.max(0, Math.min(99, qty)) }));
  }

  // Cart-line display override for a group member: a member is a separate
  // Shopify product, so its synced line would read as that product's own title.
  // Carry the PRIMARY title + the chosen option so the drawer presents it as a
  // flavour of the group (bug found in testing 2026-07-22). undefined for
  // non-group products, so ordinary lines are untouched.
  function groupPresentation(): LocalCartItem["variantGroup"] | undefined {
    if (!groupOptions || !activeGroupOption) return undefined;
    return {
      primaryTitle: product.title,
      primaryHandle: product.handle,
      label: variantGroupLabel?.trim() || "Option",
      value: activeGroupOption.label,
    };
  }

  // Subscribe & Save (quantity mode only for now: bundle lines can't carry a
  // selling plan, and the only planned subscription products are consumables).
  // null = one-time purchase, the default.
  const [sellingPlanId, setSellingPlanId] = useState<string | null>(null);
  const activePlan =
    (quantityMode && sellingPlans?.find((p) => p.id === sellingPlanId)) || null;

  /** Per-unit price for a variant under the current purchase option — the
   * plan's allocation price (Shopify's own math) when subscribed. */
  function unitAmountFor(v: ProductVariant): string {
    return activePlan?.pricesByVariant[v.id]?.amount ?? v.price.amount;
  }

  // Derive the option structure from variants. Each entry is one Shopify option
  // (e.g. "Color", "Size") and its ordered unique values. When the merchant
  // splits a single combined option into multiple separate options in Shopify
  // Admin, this picker automatically renders one section per option — no code
  // change needed here.
  const optionGroups = (() => {
    const map = new Map<string, string[]>();
    for (const v of variants) {
      for (const opt of v.selectedOptions) {
        if (!map.has(opt.name)) map.set(opt.name, []);
        const arr = map.get(opt.name)!;
        if (!arr.includes(opt.value)) arr.push(opt.value);
      }
    }
    return Array.from(map.entries()).map(([name, values]) => ({ name, values }));
  })();

  // Currently selected value per option name (derived from selectedVariant).
  const selectedOptionValues: Record<string, string> = Object.fromEntries(
    selectedVariant.selectedOptions.map((o) => [o.name, o.value]),
  );

  function pickOptionValue(name: string, value: string) {
    const next = { ...selectedOptionValues, [name]: value };
    const matched = matchVariantByOptions(next, name, value);
    if (matched) setSelectedVariant(matched);
  }

  // Matches a picked option combination to a variant: an exact match first,
  // then any variant carrying the new option value (covers cases where Shopify
  // doesn't have every combination generated).
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

  // Which button just added: the buy box's own, or the floating bar (which
  // mirrors it). The buy box's "Added to cart!" note shows only for its own
  // button - from the bar it would appear off-screen ABOVE the shopper, push
  // the page down, then pull it back up 1.8s later (owner, 2026-10-11).
  const [addedVia, setAddedVia] = useState<"box" | "bar" | null>(null);
  const addedTimer = useRef(0);
  function flashAdded(via: "box" | "bar") {
    setAddedVia(via);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAddedVia(null), 1800);
  }
  const [buyingNow, setBuyingNow] = useState(false);
  // A refused checkout used to reset the button silently, so it read as a dead
  // button (owner, 2026-09-30: "buy now doesn't work"). Say why instead - the
  // same pattern as the cart drawer's checkoutError.
  const [buyNowError, setBuyNowError] = useState<string | null>(null);

  // Reset the button after a bfcache restore. onBuyNow sets buyingNow=true and
  // navigates to Shopify; the navigation tears down the promise chain before
  // anything resets it, and Back restores React state exactly as it was - so the
  // button kept spinning AND stayed dead (onBuyNow bails while buyingNow).
  // pageshow.persisted is the canonical "came back from bfcache" signal; the
  // cart drawer has had this fix all along, the button never got it.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        setBuyingNow(false);
        setBuyNowError(null);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  const { addItem, openDrawer } = useCart();
  // Destructure the stable setter so it can be a useEffect dep without firing
  // every time the parent's context value memo recreates (it would otherwise
  // ping-pong: user clicks gallery thumb → activeIndex changes → context value
  // changes → this effect re-runs → sets gallery back to current variant's
  // image → user's click is undone). The setter itself is identity-stable via
  // a ref inside ProductMediaSync, so depending on it is loop-free.
  const { setActiveByUrl, activeUrl } = useProductMedia();

  useEffect(() => {
    setActiveByUrl(selectedVariant?.image?.url ?? null);
  }, [selectedVariant, setActiveByUrl]);

  // The selected tier, if it's still visible (null = no tiers, or the product
  // alone with nothing to choose).
  const selectedTier = tierViews.find((v) => v.i === tierIdx) ?? defaultTier;
  // A bundle tier's buy actions add the bundle product (one line; Shopify
  // expands it at checkout) and its price is the bundle's.
  const selectedTierBundle = selectedTier?.kind === "bundle" ? selectedTier.bundle : null;
  // Tier gift: only on the product-alone tier — the backing discount fires when
  // THIS product is a cart line, which a bundle tier's line isn't. Never
  // charged (the discount zeroes it), so it doesn't touch totals.
  const selectedTierGift =
    !quantityMode && selectedTier?.kind === "single" ? (tierGifts?.[selectedTier.i] ?? null) : null;

  // A bundle's options that are THIS product's own options. Shopify names a
  // customer-choose option "<component title> <option name>" ("BeePaws
  // Ultrasonic Plaque Remover Color"); those follow the colour picker above, so
  // a shopper who picked Pink gets a Pink device in the kit too — it used to
  // add the bundle's first variant (White) whatever the picker said (owner test,
  // 2026-10-12). Matched by "<title> <option>", or — if the product was renamed
  // after the bundle was made — by the option name ending the same way with
  // values the product actually has. Bundle option name → product option name.
  function ownBundleOptions(b: TierBundle): Map<string, string> {
    const own = new Map<string, string>();
    if (!b.components.some((c) => c.handle === activeProduct.handle)) return own;
    const title = activeProduct.title.toLowerCase();
    for (const bo of bundleOptionGroups(b)) {
      const n = bo.name.toLowerCase();
      const po = optionGroups.find(
        (o) =>
          n === `${title} ${o.name.toLowerCase()}` ||
          (n.endsWith(` ${o.name.toLowerCase()}`) && bo.values.every((v) => o.values.includes(v))),
      );
      if (po) own.set(bo.name, po.name);
    }
    return own;
  }

  const chosenBundleVariant = (() => {
    if (!selectedTierBundle) return null;
    const base =
      selectedTierBundle.variants.find((v) => v.id === bundleVariantId) ??
      selectedTierBundle.variants[0];
    const own = ownBundleOptions(selectedTierBundle);
    if (own.size === 0) return base;
    const wanted: Record<string, string> = Object.fromEntries(
      base.selectedOptions.map((o) => [o.name, o.value]),
    );
    for (const [bundleOpt, productOpt] of own) {
      const v = selectedOptionValues[productOpt];
      if (v) wanted[bundleOpt] = v;
    }
    return (
      selectedTierBundle.variants.find((v) =>
        v.selectedOptions.every((o) => wanted[o.name] === o.value),
      ) ?? base
    );
  })();
  const chosenBundleOptionValues: Record<string, string> = Object.fromEntries(
    chosenBundleVariant?.selectedOptions.map((o) => [o.name, o.value]) ?? [],
  );

  // Derive a bundle's option groups from its variants' selectedOptions (same
  // shape as the main product's optionGroups — a customer-choose bundle IS a
  // normal multi-variant product).
  function bundleOptionGroups(b: TierBundle) {
    const map = new Map<string, string[]>();
    for (const v of b.variants) {
      for (const opt of v.selectedOptions) {
        if (!map.has(opt.name)) map.set(opt.name, []);
        const arr = map.get(opt.name)!;
        if (!arr.includes(opt.value)) arr.push(opt.value);
      }
    }
    return Array.from(map.entries()).map(([name, values]) => ({ name, values }));
  }

  function pickBundleOption(b: TierBundle, optName: string, optValue: string) {
    const next = { ...chosenBundleOptionValues, [optName]: optValue };
    let matched = b.variants.find((v) =>
      v.selectedOptions.every((o) => next[o.name] === o.value),
    );
    if (!matched) {
      matched = b.variants.find((v) =>
        v.selectedOptions.some((o) => o.name === optName && o.value === optValue),
      );
    }
    if (matched) setBundleVariantId(matched.id);
  }

  // Group a bundle's options by the component product they belong to. Shopify
  // names a choosable option "<Component Title> <Option Name>" (e.g. "Pawspik
  // Ultrasonic Dental Scaler Color"), so we strip the matching component-title
  // prefix to get a clean per-product header + short label ("Color"). Options
  // with no matching component prefix fall into a headerless group.
  function bundleOptionGroupsByProduct(b: TierBundle) {
    const titles = b.components
      .map((c) => c.title)
      .sort((a, z) => z.length - a.length); // longest first → most specific prefix wins
    const enriched = bundleOptionGroups(b).map((o) => {
      const product = titles.find((t) => o.name.toLowerCase().startsWith(t.toLowerCase())) ?? null;
      const label = (product ? o.name.slice(product.length).trim() : o.name) || o.name;
      return { name: o.name, values: o.values, product, label };
    });
    const groups: { product: string | null; opts: typeof enriched }[] = [];
    for (const e of enriched) {
      let g = groups.find((x) => x.product === e.product);
      if (!g) {
        g = { product: e.product, opts: [] };
        groups.push(g);
      }
      g.opts.push(e);
    }
    return groups;
  }

  const currencyCode = selectedVariant?.price?.currencyCode || "USD";

  // Quantity-mode lines: every variant with a qty > 0, ready for add/checkout.
  const qtyLines = variants
    .map((v) => ({ variant: v, qty: variantQtys[v.id] ?? 0 }))
    .filter((l) => l.qty > 0 && l.variant.availableForSale);
  const qtyTotal = qtyLines.reduce(
    (sum, l) => sum + parseFloat(unitAmountFor(l.variant)) * l.qty,
    0,
  );

  const totalPrice = quantityMode
    ? qtyTotal
    : selectedTierBundle
      ? parseFloat(chosenBundleVariant?.priceAmount ?? selectedTierBundle.variants[0].priceAmount)
      : parseFloat(selectedVariant.price.amount);
  const displayCurrency = selectedTierBundle?.currencyCode || currencyCode;

  function selectTier(idx: number) {
    setTierIdx(idx);
    // Start the new tier's bundle at its first variant (or clear it).
    const b = tierBundles?.[idx] ?? null;
    setBundleVariantId(b ? (b.variants[0]?.id ?? null) : null);
  }


  // The tier gift line: never charged — the backing "BeePaws Tier Gift"
  // discount zeroes it in cart + checkout (the page only passes a gift when
  // that discount is verified ACTIVE). unitPrice 0 keeps the optimistic
  // drawer honest until the sync brings Shopify's own zeroed line cost.
  function addGiftLine(gift: TierGift) {
    addItem({
      merchandiseId: gift.variantId,
      productHandle: gift.handle,
      productTitle: gift.title,
      variantTitle: "",
      imageUrl: gift.imageUrl,
      currencyCode: gift.currencyCode,
      unitPriceAmount: "0.00",
      quantity: 1,
    });
  }

  function onAddToCart(via: "box" | "bar" = "box") {
    // Quantity mode → one cart line per variant with a chosen quantity.
    if (quantityMode) {
      if (qtyLines.length === 0) return;
      for (const { variant: v, qty } of qtyLines) {
        addItem({
          merchandiseId: v.id,
          productHandle: activeProduct.handle,
          productTitle: activeProduct.title,
          variantTitle: v.title,
          imageUrl:
            v.image?.url || activeProduct.images.edges[0]?.node?.url || "/product-placeholder.svg",
          currencyCode: v.price.currencyCode,
          // Subscribed lines carry the plan's allocation price so the drawer
          // shows what will actually be charged per delivery.
          unitPriceAmount: unitAmountFor(v),
          quantity: qty,
          sellingPlanId: activePlan?.id ?? null,
          sellingPlanName: activePlan?.name ?? null,
          variantGroup: groupPresentation(),
        });
      }
      flashAdded(via);
      return;
    }

    // Tier linked to a real Shopify bundle → add the bundle product (one line;
    // Shopify expands it into components at checkout), not the tier's items.
    if (selectedTierBundle) {
      if (!chosenBundleVariant?.availableForSale) return;
      // Map each chosen option value to the component it belongs to (Shopify
      // prefixes the option name with the component title), so the cart shows
      // e.g. "Green" under the scaler rather than on the bundle line.
      const compTitles = selectedTierBundle.components
        .map((c) => c.title)
        .sort((a, z) => z.length - a.length);
      const valuesByTitle: Record<string, string[]> = {};
      for (const o of chosenBundleVariant.selectedOptions) {
        const owner = compTitles.find((t) => o.name.toLowerCase().startsWith(t.toLowerCase()));
        if (owner) {
          if (!valuesByTitle[owner]) valuesByTitle[owner] = [];
          valuesByTitle[owner].push(o.value);
        }
      }
      addItem({
        merchandiseId: chosenBundleVariant.id,
        productHandle: selectedTierBundle.handle,
        productTitle: selectedTierBundle.title,
        variantTitle:
          chosenBundleVariant.selectedOptions.map((o) => o.value).join(" / ") || "Bundle",
        imageUrl: selectedTierBundle.imageUrl,
        currencyCode: selectedTierBundle.currencyCode,
        unitPriceAmount: chosenBundleVariant.priceAmount,
        quantity: 1,
        // Carry the components so the cart line can list what's inside the bundle.
        bundleComponents: selectedTierBundle.components.map((c) => ({
          quantity: c.quantity,
          title: c.title,
          imageUrl: c.imageUrl,
          options: valuesByTitle[c.title],
        })),
      });
      flashAdded(via);
      return;
    }

    // The product alone: the picked variant ×1, plus the tier's gift if any.
    if (!selectedVariant?.availableForSale) return;
    addItem({
      merchandiseId: selectedVariant.id,
      productHandle: activeProduct.handle,
      productTitle: activeProduct.title,
      variantTitle: selectedVariant.title,
      imageUrl:
        selectedVariant.image?.url ||
        activeProduct.images.edges[0]?.node?.url ||
        "/product-placeholder.svg",
      currencyCode: selectedVariant.price.currencyCode,
      unitPriceAmount: selectedVariant.price.amount,
      quantity: 1,
      variantGroup: groupPresentation(),
    });
    if (selectedTierGift) addGiftLine(selectedTierGift);
    flashAdded(via);
  }

  // Buy It Now — bypass the local cart and POST the current bundle composition
  // straight to /api/shopify/cart/checkout, then redirect to Shopify checkout.
  // Same checkout-route pattern the retired BundleBuyCard used.
  async function onBuyNow() {
    if (buyingNow) return;
    setBuyNowError(null);

    // Quantity mode → checkout with one line per chosen variant quantity.
    if (quantityMode) {
      if (qtyLines.length === 0) return;
      return checkoutWith(
        qtyLines.map((l) => ({
          merchandiseId: l.variant.id,
          quantity: l.qty,
          ...(activePlan ? { sellingPlanId: activePlan.id } : {}),
        })),
      );
    }

    // Bundle tier → checkout with just the bundle line (Shopify expands it).
    if (selectedTierBundle) {
      if (!chosenBundleVariant?.availableForSale) return;
      return checkoutWith([{ merchandiseId: chosenBundleVariant.id, quantity: 1 }]);
    }

    // The product alone, plus the tier's gift line (zeroed by the backing
    // Tier Gift discount at checkout).
    if (!selectedVariant?.availableForSale) return;
    return checkoutWith([
      { merchandiseId: selectedVariant.id, quantity: 1 },
      ...(selectedTierGift ? [{ merchandiseId: selectedTierGift.variantId, quantity: 1 }] : []),
    ]);
  }

  // The one POST + redirect behind every Buy-now path. A refused checkout
  // resets the button and says why (buyNowError) instead of going quiet.
  async function checkoutWith(lines: CheckoutLine[]) {
    setBuyingNow(true);
    try {
      const res = await fetch("/api/shopify/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Couldn't open checkout");
      }
      window.location.assign(data.checkoutUrl);
    } catch (e) {
      setBuyingNow(false);
      setBuyNowError(e instanceof Error ? e.message : "Couldn't open checkout");
    }
  }

  const isAvailable = quantityMode
    ? qtyLines.length > 0
    : selectedTierBundle
      ? (chosenBundleVariant?.availableForSale ?? false)
      : selectedVariant?.availableForSale;

  // The floating add-to-cart bar mirrors this buy box (BuyBoxSync): what the
  // button below would add, at its price, and the add itself.
  const pick = (v: ProductVariant) => (v.title === "Default Title" ? "" : v.title);
  usePublishBuyBox(
    {
      title:
        !quantityMode && showTierChoice && selectedTier ? tierName(selectedTier) : activeProduct.title,
      detail: quantityMode
        ? qtyLines.map((l) => `${l.qty} × ${pick(l.variant) || activeProduct.title}`).join(", ")
        : selectedTierBundle
          ? (chosenBundleVariant?.selectedOptions.map((o) => o.value).join(" / ") ?? "")
          : pick(selectedVariant),
      price: formatMoney(totalPrice, displayCurrency),
      imageUrl:
        (selectedTierBundle ? selectedTierBundle.imageUrl : selectedVariant.image?.url) ??
        activeProduct.images.edges[0]?.node?.url ??
        null,
      available: !!isAvailable,
      added: addedVia !== null,
    },
    () => onAddToCart("bar"),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* No "Your selection" total here — the hero price row above shows the
          from-price, and the running total is baked into the Add-to-cart label
          below. One price on screen at a time per the device reference. */}

      {/* Variant group (combined listing): each option is a SEPARATE Shopify
          product shown as one choice here. Full-width stacked rows like the
          non-color option picker, since flavour names are wordy. Unavailable
          members render DISABLED rather than hidden (contract §4) so the
          range stays legible. Labels come from the metafield — never the
          Shopify title, which HyperSKU overwrites on sync. */}
      {groupOptions && groupOptions.length > 1 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-bold text-cocoa">{variantGroupLabel?.trim() || "Option"}</span>
            <span className="text-brown">{activeGroupOption?.label}</span>
          </div>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={variantGroupLabel?.trim() || "Option"}>
            {groupOptions.map((opt) => {
              const active = opt.handle === activeGroupOption?.handle;
              return (
                <button
                  key={opt.handle}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!opt.availableForSale}
                  onClick={() => selectGroupMember(opt)}
                  className={`flex w-full min-h-[44px] items-center justify-between gap-3 rounded-xl border-[1.8px] px-4 py-2.5 text-left text-sm font-bold transition-all ${
                    active
                      ? "border-clay bg-[#FCFBF4] text-cocoa shadow-sm"
                      : "border-line text-cocoa hover:border-clay/60"
                  } ${!opt.availableForSale ? "cursor-not-allowed opacity-50 hover:border-line" : ""}`}
                >
                  <span className="min-w-0 truncate">{opt.label}</span>
                  {!opt.availableForSale && (
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-brown">
                      Sold out
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {quantityMode ? (
        /* Quantity rows — one per variant, each with its own stepper (owner
           decision 2026-07-10, for products without tiers): the row IS the
           option, so the option picker and tier cards are skipped entirely. */
        <div>
          {/* Purchase options — Subscribe & Save (handoff §1). Copy guardrail:
              cadence + discount come from the plan name (Shopify's own), the
              cancel claim is true (the customer portal allows it), and it must
              stay consistent with the guarantee's "no subscription you can't
              cancel" line. Radio cards mirror the tier-card pattern. */}
          {sellingPlans && sellingPlans.length > 0 && (
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brown">
                  Purchase options
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>
              <div className="space-y-3" role="radiogroup" aria-label="Purchase options">
                {[
                  { id: null as string | null, name: "One-time purchase", desc: "Pay once — no renewals." },
                  ...sellingPlans.map((p) => ({
                    id: p.id as string | null,
                    name: p.name,
                    desc: "Renews at the discounted price each delivery. Cancel from your account anytime.",
                  })),
                ].map((opt) => {
                  const selected = sellingPlanId === opt.id;
                  return (
                    <div
                      key={opt.id ?? "one-time"}
                      role="radio"
                      aria-checked={selected}
                      tabIndex={0}
                      onClick={() => setSellingPlanId(opt.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSellingPlanId(opt.id);
                        }
                      }}
                      className={`relative cursor-pointer rounded-[13px] border-[1.8px] py-3 pl-12 pr-4 transition-all ${
                        selected
                          ? "border-clay bg-[#FCFBF4] shadow-sm"
                          : "border-line bg-card hover:border-clay/60"
                      }`}
                    >
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
                      <span className="block text-[15px] font-bold text-cocoa">{opt.name}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-snug text-brown">
                        {opt.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brown">
              Choose your quantities
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>
          <div className="space-y-3">
            {variants.map((v) => {
              const qty = variantQtys[v.id] ?? 0;
              const soldOut = !v.availableForSale;
              const label = v.selectedOptions.map((o) => o.value).join(" / ") || activeProduct.title;
              return (
                <div
                  key={v.id}
                  className={`flex items-center justify-between gap-3 rounded-[13px] border-[1.8px] px-4 py-3 transition-all ${
                    qty > 0 && !soldOut ? "border-clay bg-[#FCFBF4]" : "border-line bg-card"
                  } ${soldOut ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-cocoa">{label}</p>
                    {soldOut ? (
                      <p className="text-[12.5px] text-brown">Out of stock</p>
                    ) : (
                      <p className="text-[12.5px] text-brown">
                        {formatMoney(parseFloat(unitAmountFor(v)), v.price.currencyCode)} each
                        {/* Struck one-time price when a plan discounts it. */}
                        {activePlan && unitAmountFor(v) !== v.price.amount && (
                          <span className="ml-1.5 text-brown/60 line-through">
                            {formatMoney(parseFloat(v.price.amount), v.price.currencyCode)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`One less: ${label}`}
                      disabled={soldOut || qty === 0}
                      onClick={() => setVariantQty(v.id, qty - 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border-[1.8px] border-line text-cocoa transition-colors hover:border-clay/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="min-w-[2rem] text-center text-[15px] font-bold tabular-nums text-cocoa">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`One more: ${label}`}
                      disabled={soldOut}
                      onClick={() => setVariantQty(v.id, qty + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border-[1.8px] border-line text-cocoa transition-colors hover:border-clay/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
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

      {/* Tier cards (Bundle & Save) — only when there is a real choice. With one
          visible tier (e.g. before any bundle is set up) the colour picker
          above and the button below are the whole buy box. */}
      {showTierChoice && (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brown">
            Bundle &amp; Save
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="space-y-3">
          {tierViews.map((view) => {
            const i = view.i;
            const selected = selectedTier?.i === i;
            const tb = view.kind === "bundle" ? view.bundle : null;
            const gift = selected && !tb ? (tierGifts?.[i] ?? null) : null;
            // A bundle tier quotes its chosen variant once selected (its first
            // before that); the product-alone tier quotes the picked variant.
            const tbVariant = tb ? (selected ? chosenBundleVariant : tb.variants[0]) : null;
            const tTotal = tb
              ? parseFloat(tbVariant?.priceAmount ?? tb.variants[0].priceAmount)
              : parseFloat(selectedVariant.price.amount);
            const tCurrency = tb ? tb.currencyCode : currencyCode;
            // Inline pickers only for options the picker above doesn't already
            // drive (e.g. another component's flavour); this product's own
            // colour comes from the top picker.
            const ownOpts = tb ? ownBundleOptions(tb) : null;
            const bGroups = tb
              ? bundleOptionGroupsByProduct(tb)
                  .map((g) => ({ ...g, opts: g.opts.filter((o) => !ownOpts?.has(o.name)) }))
                  .filter((g) => g.opts.length > 0)
              : [];
            const description = bundleTiers?.[i]?.description?.trim();
            // Authored per tier ("Best value"); no claim without the owner's say.
            const badge = bundleTiers?.[i]?.badge?.trim();

            return (
              <div
                key={i}
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

                {/* Floating flag — sits half-above the card border at top-right. */}
                {badge && (
                  <span className="absolute -top-2.5 right-3.5 rounded-full bg-cocoa px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white">
                    {badge}
                  </span>
                )}

                {/* Title row: tier name + price on one baseline. */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[15.5px] font-bold text-cocoa">{tierName(view)}</span>
                  <span className="text-[15.5px] font-bold tabular-nums text-cocoa">
                    {formatMoney(tTotal, tCurrency)}
                  </span>
                </div>

                {description && (
                  <p className="mt-0.5 text-[12.5px] leading-snug text-brown">{description}</p>
                )}

                {/* What's included — for the SELECTED tier only, so the others
                    stay a scannable name + price + description row. */}
                {selected && (tb ? (
                  <ul className="mt-2 space-y-1 text-[12px] text-brown">
                    {tb.components.map((c, ci) => (
                      <li key={c.handle} className="flex items-center gap-2">
                        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-line bg-cream">
                          <Image
                            src={c.imageUrl || "/product-placeholder.svg"}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="24px"
                          />
                        </span>
                        <span className="min-w-0 truncate">
                          {c.quantity}×{" "}
                          {/* New tab so the configured tier/variant state
                              survives; stopPropagation so the card's
                              selectTier onClick doesn't also fire. */}
                          <a
                            href={`/products/${c.handle}`}
                            target="_blank"
                            rel="noopener"
                            onClick={(e) => e.stopPropagation()}
                            className="text-cocoa underline decoration-line underline-offset-2 hover:text-clay"
                          >
                            {c.title}
                          </a>
                        </span>
                        {ci === 0 && (
                          <span className="ml-auto shrink-0 rounded-full bg-honey-tint px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-gold-deep">
                            Bundle
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="mt-2 space-y-1 text-[12px] text-brown">
                    <li className="flex items-center gap-2">
                      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-line bg-cream">
                        <Image
                          src={
                            selectedVariant.image?.url ||
                            activeProduct.images.edges[0]?.node?.url ||
                            "/product-placeholder.svg"
                          }
                          alt=""
                          fill
                          className="object-cover"
                          sizes="24px"
                        />
                      </span>
                      <span className="min-w-0 truncate">
                        <span className="font-bold">1×</span> {activeProduct.title}
                      </span>
                    </li>
                    {gift && (
                      <li className="flex items-center gap-2">
                        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-line bg-cream">
                          <Image
                            src={gift.imageUrl || "/product-placeholder.svg"}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="24px"
                          />
                        </span>
                        <span className="min-w-0 truncate">1× {gift.title}</span>
                        <span className="shrink-0 rounded-full bg-honey-tint px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-gold-deep">
                          Gift
                        </span>
                        <span className="ml-auto shrink-0 tabular-nums">
                          <span className="mr-1.5 text-brown/60 line-through">
                            {formatMoney(parseFloat(gift.priceAmount), gift.currencyCode)}
                          </span>
                          <span className="font-bold text-positive">FREE</span>
                        </span>
                      </li>
                    )}
                  </ul>
                ))}

                {/* Bundle option pickers — a customer-choose bundle is a normal
                    multi-variant product, so pick its options inline (reusing the
                    swatch/chip UI). Grouped by component product: product name as
                    a header, then each option as a "Label: [swatches]" row (mirrors
                    the per-unit picker layout). Picking updates the chosen variant. */}
                {selected && tb && bGroups.length > 0 && (
                  <div className="mt-3 space-y-3 border-t border-line pt-3">
                    {bGroups.map((grp, gi) => (
                      <div key={grp.product ?? `g${gi}`} className="space-y-1.5">
                        {grp.product && (
                          <p className="text-[14.5px] font-bold text-cocoa">{grp.product}</p>
                        )}
                        {grp.opts.map((opt) => {
                          const colorMode = opt.label.toLowerCase().includes("color");
                          const sel = chosenBundleOptionValues[opt.name];
                          return (
                            <div
                              key={opt.name}
                              className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
                            >
                              <span className="text-[11px] font-semibold text-brown">
                                {opt.label}:
                              </span>
                              {opt.values.map((value) => {
                                const active = sel === value;
                                if (colorMode) {
                                  const colors = resolveSwatchColors(value);
                                  if (colors) {
                                    return (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          pickBundleOption(tb, opt.name, value);
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
                                      pickBundleOption(tb, opt.name, value);
                                    }}
                                    className={`rounded-lg border-[1.8px] px-3 py-1.5 text-xs font-bold transition-all ${
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
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
        </>
      )}

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
          onClick={() => onAddToCart()}
        >
          {quantityMode && qtyLines.length === 0
            ? "Choose a quantity above"
            : isAvailable
              ? `Add to cart — ${formatMoney(totalPrice, displayCurrency)}`
              : "Out of stock"}
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
        {buyNowError && (
          <p role="alert" className="mt-2 text-center text-xs text-rose-600">
            {buyNowError}
          </p>
        )}

        {/* Compact trust line — sits flush under the CTA at the decision moment. */}
        {/* Copy audit §1.9: "Secure checkout" is corporate-logistics voice;
            a named human behind the warranty is the trust signal. */}
        <p className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs font-medium text-brown">
          <span>30-day return, no questions asked</span>
          <span aria-hidden className="text-brown/40">·</span>
          <span>Free shipping over $50</span>
          <span aria-hidden className="text-brown/40">·</span>
          <span>Real-person support</span>
        </p>

        {/* The payment-badge strip that sat here was removed 2026-09-30 (owner:
            it took space and did little). Shopify's checkout already shows the
            accepted cards and the express wallets, where the choice is made. */}


        {addedVia === "box" && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-positive">
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