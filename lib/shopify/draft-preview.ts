import type { BeepawsMetafields } from "@/types/metafields";

// Map a beepaws-admin draft (snake_case keys, already-native JSON values) onto the
// normalized.beepaws shape. Inverse of parseBeepaws() in admin-product-page.ts —
// keep the two key lists in sync (same 26 keys). Draft values are NOT JSON strings
// (unlike Shopify metafields), so no JSON.parse.
export function beepawsFromDraft(content: Record<string, unknown>): BeepawsMetafields {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (k: string): any => content?.[k] ?? null;
  return {
    comparisonRows: g("comparison_rows"),
    useCases: g("use_cases"),
    faqItems: g("faq_items"),
    reviews: g("reviews"),
    stats: g("stats"),
    techSpecs: g("tech_specs"),
    bullets: g("product_bullets"),
    ingredients: g("ingredients"),
    ingredientGroups: g("ingredient_groups"),
    ingredientsIntro: g("ingredients_intro"),
    tagline: g("tagline"), // string
    educationNote: g("education_note"), // string
    beforeAfterSlides: g("before_after_slides"),
    bundleTiers: g("bundle_tiers"),
    discoveryProducts: g("discovery_products"),
    painPoints: g("pain_points"),
    painPointsIntro: g("pain_points_intro"),
    mechanismSteps: g("mechanism_steps"),
    mechanismIntro: g("mechanism_intro"),
    guarantee: g("guarantee"),
    useCasesIntro: g("use_cases_intro"),
    comparisonIntro: g("comparison_intro"),
    faqIntro: g("faq_intro"),
    reviewsIntro: g("reviews_intro"),
    beforeAfterIntro: g("before_after_intro"),
    finalCtaCopy: g("final_cta_copy"),
  };
}

// Fetch the current draft from the local beepaws-admin tool. Server-side only
// (no CORS). `adminPort` (from the preview URL's ?admin=… — the admin passes its
// own port there) wins over BEEPAWS_ADMIN_URL, so it works whatever port the admin
// ended up on. Returns null if the admin isn't running or has no draft, so the
// preview route falls back to pushed Shopify content.
export async function fetchAdminDraft(
  handle: string,
  adminPort?: string,
): Promise<{ content: Record<string, unknown>; exists: boolean } | null> {
  const base =
    adminPort && /^\d+$/.test(adminPort)
      ? `http://localhost:${adminPort}`
      : process.env.BEEPAWS_ADMIN_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/products/${handle}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as { content: Record<string, unknown>; exists: boolean };
  } catch {
    return null;
  }
}
