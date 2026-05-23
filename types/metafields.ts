export interface ComparisonRow {
  label: string;
  beepaws: boolean;
  vet: boolean;
  other: boolean;
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

export interface MechanismStep {
  number: string;
  title: string;
  description: string;
}

export interface Guarantee {
  sealNumber: string;
  sealLabel: string;
  title: string;
  description: string;
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
  mechanismSteps: MechanismStep[] | null;
  guarantee: Guarantee[] | null;
}
