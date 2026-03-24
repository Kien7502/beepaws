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
  variants: {
    edges: {
      node: ProductVariant;
    }[];
  };
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
