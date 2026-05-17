export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  images: {
    edges: {
      node: Image;
    }[];
  };
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  // Present when at least one variant has a compareAtPrice. Used to drive
  // "SALE" badges and savings calculations on cards/PDP.
  compareAtPriceRange?: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  } | null;
  variants: {
    edges: {
      node: ProductVariant;
    }[];
  };
  // Aggregated from beepaws.reviews metafield on catalog fetch. Null if
  // the metafield is missing — card hides the rating row in that case.
  rating?: { avg: number; count: number } | null;
  // First sentence of descriptionHtml's first <p>, derived server-side.
  // Used as the short tagline on product cards. Null if no <p> exists.
  tagline?: string | null;
  tags?: string[];
  seo: SEO;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  // Variant-specific image when the merchant assigns one in Shopify Admin
  // (Product → Variants → Edit → Media). Used to sync the gallery to the
  // selected variant. Null if the variant doesn't have a dedicated image.
  image?: { url: string; altText: string } | null;
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  seo: SEO;
  products: {
    edges: {
      node: Product;
    }[];
  };
};

export type Image = {
  url: string;
  altText: string;
  width: number;
  height: number;
};

export type Money = {
  amount: string;
  currencyCode: string;
};

export type SEO = {
  title: string;
  description: string;
};

export type ShopifyFetchParams = {
  query: string;
  variables?: Record<string, unknown>;
  cache?: RequestCache;
  tags?: string[];
};
