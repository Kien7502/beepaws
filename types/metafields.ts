export interface ComparisonRow {
  label: string;
  beepaws: boolean;
  vet: boolean;
  other: boolean;
  // Optional text values render in place of the ✓/✕ icon for that cell — used
  // for rows like "One-time cost" ($59 / $500–$1,400+ / Ongoing). The boolean
  // still drives the cell color (true = clay, false = rose). Blank = icon.
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
  comparisonRows: ComparisonRow[] | null;
  useCases: UseCaseCard[] | null;
  faqItems: FaqItem[] | null;
  reviews: Review[] | null;
  stats: StatItem[] | null;
  techSpecs: TechSpec[] | null;
  bullets: string[] | null;
  ingredients: string[] | null;
  // Short one-line tagline shown on product cards (and reserved for PDP).
  // When null, ProductCard falls back to the first sentence of descriptionHtml.
  tagline: string | null;
  educationNote: string | null;
  beforeAfterSlides: BeforeAfterSlide[] | null;
  bundleTiers: BundleTierCopy[] | null;
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
