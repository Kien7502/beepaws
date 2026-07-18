// Comparison table — dynamic columns + rows. Authored by beepaws-admin and
// stored as a ComparisonData object; each row carries one cell per column,
// positionally aligned to `columns`. normalizeComparison (in ComparisonTable)
// migrates the legacy array shape below.
export interface ComparisonColumn {
  label: string;
  icon: string; // lucide name — see COLUMN_ICONS in ComparisonTable
}
export interface ComparisonCell {
  on: boolean; // drives the ✓/✕ + color (true = clay, false = rose)
  text?: string | null; // optional text override (replaces the icon)
}
export interface ComparisonRow {
  label: string;
  cells: ComparisonCell[];
}
export interface ComparisonData {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
}

// Legacy shape (pre-dynamic-columns): a flat array of rows keyed BeePaws/Vet/
// Other. Still read for products authored before the migration.
export interface LegacyComparisonRow {
  label: string;
  beepaws: boolean;
  vet: boolean;
  other: boolean;
  beepawsText?: string;
  vetText?: string;
  otherText?: string;
}

export interface UseCaseCard {
  emoji: string;
  label: string;
  title: string;
  description: string;
  from: string;
  to: string;
  image?: string | null;
}

export interface FaqItem {
  icon: string;
  q: string;
  a: string;
}

export interface Review {
  name: string;
  time: string;
  rating: number;
  likes: number;
  comments: number;
  text: string;
  reply: string | null;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface TechSpec {
  label: string;
  value: string;
}

export interface BeforeAfterSlide {
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  petName?: string;
  caption?: string | null;
}

// Per-tier override of the bundle picker copy. Structure (mainQty, addonRefs,
// popular/bestValue badges) stays code-defined — only the visible text is
// overridable so editors can A/B copy without breaking pricing/composition.
// Index 0 = Starter, 1 = Complete Care, 2 = Family Pack. Missing entries or
// empty strings fall back to the in-code defaults in VariantSelector.
export interface BundleTierCopy {
  name?: string;
  description?: string;
  /** Optional link to a real Shopify bundle product, stored inside the
   * `beepaws.bundle_tiers` JSON by beepaws-admin (plain data, NOT a Shopify
   * reference — resolve via handle/id storefront-side). When present, selecting
   * this tier adds the bundle product to the cart (one line; Shopify expands it)
   * instead of the tier's separate items. */
  bundle?: { id: string; handle: string; title: string } | null;
  /** COMPOSED KIT contents (admin handoff 2026-07-19, beepaws-admin backlog
   * #20): one cart line per component — this is how a tier offers a
   * subscribable component (bundle lines can't carry selling plans). Same
   * nested product_ref shape as discovery_products. Precedence: `bundle`
   * wins over `components`; both empty → legacy code-defined composition.
   * Pricing is NEVER authored here — the kit total is the sum of the real
   * component line prices. */
  components?:
    | {
        product?: { id?: string; handle?: string; title?: string } | null;
        quantity?: number;
      }[]
    | null;
}

/** One "What's inside" formula group (`beepaws.ingredient_groups`). A product
 * with one formula authors a single (optionally unlabeled) group; a
 * multi-formula product (e.g. the dental spray's Unflavored vs Beef) authors
 * one group per formula and the section shows a local toggle. `items` is
 * authored one-ingredient-per-line as "Name — what it's for"; the storefront
 * splits on a SPACED dash, so hyphenated ingredient names survive. */
export interface IngredientGroup {
  label?: string;
  items?: string;
}

/** One curated pick for the "More from BeePaws" discovery band
 * (`beepaws.discovery_products`). Mirrors the admin tool's list_of_objects
 * shape: the ref nests under `product` (same nesting as
 * bundle_tiers[i].bundle) and is plain JSON, NOT a native Shopify
 * reference — the storefront resolves it by handle. */
export interface DiscoveryPick {
  product?: { id?: string; handle?: string; title?: string } | null;
}

export interface PainPoint {
  number: string;
  title: string;
  description: string;
}

// Section-level intro copy for PainPoints — stored as a single-entry list
// (index 0) like Guarantee. Empty/missing fields fall back to the component's
// in-code defaults. Keeps the per-item PainPoint[] separate from the header.
export interface PainPointsIntro {
  eyebrow?: string;
  heading?: string;
  lead?: string;
}

export interface MechanismStep {
  number: string;
  title: string;
  description: string;
}

// Section-level intro copy for Mechanism — single-entry list (index 0).
// paradoxParagraph1/2 map to the component's paradoxParagraphs[] (the page
// reconstructs the array). Missing fields fall back to in-code defaults.
export interface MechanismIntro {
  introEyebrow?: string;
  introHeading?: string;
  introLead?: string;
  paradoxHeading?: string;
  paradoxParagraph1?: string;
  paradoxParagraph2?: string;
  paradoxPullQuote?: string;
  stepsHeading?: string;
  stepsLead?: string;
  feelsBrokenHeading?: string;
  /** Long-form callout body (audit §4.10). Split from education_note
   * 2026-07-17 — that field kept the SHORT buy-column reassurance (§1.5)
   * and this one holds the dark callout's longer version. */
  feelsBrokenBody?: string;
}

export interface Guarantee {
  sealNumber: string;
  sealLabel: string;
  title: string;
  description: string;
}

// Generic section-header copy (eyebrow + heading + optional lead), stored as a
// single-entry list (index 0) like Guarantee. Shared by UseCases, Comparison,
// FAQ, Reviews, and Before/After. Empty/missing fields fall back to each
// component's in-code Lorem default per-field.
export interface SectionIntro {
  eyebrow?: string;
  heading?: string;
  lead?: string;
  // Comparison table only — small print rendered under the table.
  footnote?: string;
}

// Final CTA section copy — heading + body + the small-print promise line.
// The guarantee seal/copy is a separate metafield (Guarantee).
export interface FinalCtaCopy {
  heading?: string;
  body?: string;
  smallPrint?: string;
}

export interface BeepawsMetafields {
  // The dynamic { columns, rows } object, or the legacy array (migrated on read).
  comparisonRows: ComparisonData | LegacyComparisonRow[] | null;
  useCases: UseCaseCard[] | null;
  faqItems: FaqItem[] | null;
  reviews: Review[] | null;
  stats: StatItem[] | null;
  techSpecs: TechSpec[] | null;
  bullets: string[] | null;
  // Legacy flat list — superseded by ingredientGroups; still renders as a
  // single unlabeled group when groups are unset.
  ingredients: string[] | null;
  // "What's inside" formula groups + the section's intro copy.
  ingredientGroups: IngredientGroup[] | null;
  ingredientsIntro: SectionIntro[] | null;
  // Short one-line tagline shown on product cards (and reserved for PDP).
  // When null, ProductCard falls back to the first sentence of descriptionHtml.
  tagline: string | null;
  educationNote: string | null;
  beforeAfterSlides: BeforeAfterSlide[] | null;
  bundleTiers: BundleTierCopy[] | null;
  // Curated picks for the "More from BeePaws" band; null/empty → automatic.
  discoveryProducts: DiscoveryPick[] | null;
  painPoints: PainPoint[] | null;
  painPointsIntro: PainPointsIntro[] | null;
  mechanismSteps: MechanismStep[] | null;
  mechanismIntro: MechanismIntro[] | null;
  guarantee: Guarantee[] | null;
  // Section-header copy for the remaining sections (single-entry lists).
  useCasesIntro: SectionIntro[] | null;
  comparisonIntro: SectionIntro[] | null;
  faqIntro: SectionIntro[] | null;
  reviewsIntro: SectionIntro[] | null;
  beforeAfterIntro: SectionIntro[] | null;
  finalCtaCopy: FinalCtaCopy[] | null;
}
