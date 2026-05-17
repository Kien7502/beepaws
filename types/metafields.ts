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
}
