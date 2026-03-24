import type { Collection, Image, Money, Product, ProductVariant } from "@/types/shopify";

function money(amount: string, currencyCode = "USD"): Money {
  return { amount, currencyCode };
}

function img(url: string, alt: string): Image {
  return { url, altText: alt, width: 1200, height: 1200 };
}

function variant(
  id: string,
  title: string,
  price: Money,
  available = true,
  selectedOptions: { name: string; value: string }[] = [],
): ProductVariant {
  return {
    id: `gid://shopify/ProductVariant/${id}`,
    title,
    availableForSale: available,
    price,
    selectedOptions,
  };
}

const MOCK_IMAGES = {
  dogBed:
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop",
  leash:
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1200&auto=format&fit=crop",
  catTower:
    "https://images.unsplash.com/photo-1545249390-6bdfa286032f?q=80&w=1200&auto=format&fit=crop",
  toys:
    "https://images.unsplash.com/photo-1535294435445-d724952986ef?q=80&w=1200&auto=format&fit=crop",
  grooming:
    "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200&auto=format&fit=crop",
  feeder:
    "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=1200&auto=format&fit=crop",
};

const products: Product[] = [
  {
    id: "gid://shopify/Product/1001",
    handle: "cozy-dog-bed",
    title: "Cozy Orthopedic Dog Bed",
    description:
      "Plush memory foam base with washable cover. Supports joints for better sleep.",
    descriptionHtml:
      "<p>Plush memory foam base with washable cover. Supports joints for better sleep.</p><ul><li>Removable cover</li><li>Non-slip bottom</li></ul>",
    availableForSale: true,
    images: {
      edges: [
        { node: img(MOCK_IMAGES.dogBed, "Dog resting on bed") },
        {
          node: img(
            "https://images.unsplash.com/photo-1534361960057-19889db9621e?q=80&w=1200&auto=format&fit=crop",
            "Dog bed in room",
          ),
        },
      ],
    },
    priceRange: {
      minVariantPrice: money("89.00"),
      maxVariantPrice: money("109.00"),
    },
    variants: {
      edges: [
        {
          node: variant(
            "v1001-s",
            "Small",
            money("89.00"),
            true,
            [{ name: "Size", value: "Small" }],
          ),
        },
        {
          node: variant(
            "v1001-m",
            "Medium",
            money("99.00"),
            true,
            [{ name: "Size", value: "Medium" }],
          ),
        },
        {
          node: variant(
            "v1001-l",
            "Large",
            money("109.00"),
            true,
            [{ name: "Size", value: "Large" }],
          ),
        },
      ],
    },
    seo: {
      title: "Cozy Orthopedic Dog Bed | Beepaws",
      description: "Premium dog bed with memory foam.",
    },
  },
  {
    id: "gid://shopify/Product/1002",
    handle: "premium-dog-leash",
    title: "Premium Reflective Dog Leash",
    description: "Heavy-duty nylon with padded handle and night visibility strips.",
    descriptionHtml:
      "<p>Heavy-duty nylon with padded handle and night visibility strips.</p>",
    availableForSale: true,
    images: { edges: [{ node: img(MOCK_IMAGES.leash, "Dog on leash") }] },
    priceRange: {
      minVariantPrice: money("24.00"),
      maxVariantPrice: money("24.00"),
    },
    variants: {
      edges: [
        { node: variant("v1002-1", "Default Title", money("24.00")) },
      ],
    },
    seo: { title: "Premium Dog Leash", description: "Reflective leash" },
  },
  {
    id: "gid://shopify/Product/1003",
    handle: "catnip-play-tower",
    title: "Catnip Play Tower",
    description: "Multi-level sisal posts, cozy hideaway, and dangling toys.",
    descriptionHtml: "<p>Multi-level sisal posts with hideaway and toys.</p>",
    availableForSale: true,
    images: { edges: [{ node: img(MOCK_IMAGES.catTower, "Cat tree") }] },
    priceRange: {
      minVariantPrice: money("129.00"),
      maxVariantPrice: money("129.00"),
    },
    variants: {
      edges: [
        { node: variant("v1003-1", "Default Title", money("129.00")) },
      ],
    },
    seo: { title: "Cat Play Tower", description: "Cat tree" },
  },
  {
    id: "gid://shopify/Product/1004",
    handle: "squeaky-ball-set",
    title: "Squeaky Ball Set (6-Pack)",
    description: "Non-toxic rubber balls in assorted colors. Great for fetch.",
    descriptionHtml: "<p>Non-toxic rubber balls in assorted colors.</p>",
    availableForSale: true,
    images: { edges: [{ node: img(MOCK_IMAGES.toys, "Pet toys") }] },
    priceRange: {
      minVariantPrice: money("18.00"),
      maxVariantPrice: money("18.00"),
    },
    variants: {
      edges: [
        { node: variant("v1004-1", "Default Title", money("18.00")) },
      ],
    },
    seo: { title: "Squeaky Balls", description: "Toy set" },
  },
  {
    id: "gid://shopify/Product/1005",
    handle: "pro-grooming-kit",
    title: "Pro Grooming Kit",
    description: "Brushes, nail clippers, and comb in a travel case.",
    descriptionHtml: "<p>Complete grooming set in a compact travel case.</p>",
    availableForSale: true,
    images: { edges: [{ node: img(MOCK_IMAGES.grooming, "Grooming") }] },
    priceRange: {
      minVariantPrice: money("42.00"),
      maxVariantPrice: money("42.00"),
    },
    variants: {
      edges: [
        { node: variant("v1005-1", "Default Title", money("42.00")) },
      ],
    },
    seo: { title: "Grooming Kit", description: "Pet grooming" },
  },
  {
    id: "gid://shopify/Product/1006",
    handle: "smart-pet-feeder",
    title: "Smart Pet Feeder",
    description: "Programmable portions, dual power, easy-clean tray.",
    descriptionHtml: "<p>Programmable portions with dual power and easy-clean tray.</p>",
    availableForSale: true,
    images: { edges: [{ node: img(MOCK_IMAGES.feeder, "Pet feeder") }] },
    priceRange: {
      minVariantPrice: money("79.00"),
      maxVariantPrice: money("79.00"),
    },
    variants: {
      edges: [
        { node: variant("v1006-1", "Default Title", money("79.00")) },
      ],
    },
    seo: { title: "Smart Feeder", description: "Automatic feeder" },
  },
];

/** Collection handle → product handles (demo catalog) */
const COLLECTION_PRODUCTS: Record<string, string[]> = {
  dogs: [
    "cozy-dog-bed",
    "premium-dog-leash",
    "pro-grooming-kit",
    "squeaky-ball-set",
  ],
  cats: ["catnip-play-tower", "smart-pet-feeder", "squeaky-ball-set"],
  new: ["cozy-dog-bed", "premium-dog-leash", "catnip-play-tower"],
};

export function getMockProducts(): Product[] {
  return products;
}

export function getMockProduct(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

export function getMockProductsFiltered({
  collectionHandle,
}: {
  collectionHandle?: string;
}): Product[] {
  if (!collectionHandle || collectionHandle === "all") {
    return [...products];
  }
  const handles = COLLECTION_PRODUCTS[collectionHandle];
  if (!handles?.length) {
    return [];
  }
  const set = new Set(handles);
  return products.filter((p) => set.has(p.handle));
}

export function getMockCollections(): Collection[] {
  return [
    {
      id: "gid://shopify/Collection/1",
      handle: "all",
      title: "All Products",
      description: "Everything for dogs and cats.",
      seo: { title: "All", description: "Shop all" },
      products: { edges: products.map((p) => ({ node: p })) },
    },
    {
      id: "gid://shopify/Collection/2",
      handle: "dogs",
      title: "For Dogs",
      description: "Beds, leashes, toys, and care.",
      seo: { title: "Dogs", description: "Dog products" },
      products: {
        edges: getMockProductsFiltered({ collectionHandle: "dogs" }).map(
          (p) => ({ node: p }),
        ),
      },
    },
    {
      id: "gid://shopify/Collection/3",
      handle: "cats",
      title: "For Cats",
      description: "Towers, feeders, and play.",
      seo: { title: "Cats", description: "Cat products" },
      products: {
        edges: getMockProductsFiltered({ collectionHandle: "cats" }).map(
          (p) => ({ node: p }),
        ),
      },
    },
    {
      id: "gid://shopify/Collection/4",
      handle: "new",
      title: "New Arrivals",
      description: "Latest picks.",
      seo: { title: "New", description: "New arrivals" },
      products: {
        edges: getMockProductsFiltered({ collectionHandle: "new" }).map(
          (p) => ({ node: p }),
        ),
      },
    },
  ];
}

/** Demo cart lines for checkout preview (fixed totals) */
export type MockCartLine = {
  id: string;
  title: string;
  variantTitle: string;
  quantity: number;
  unitPrice: Money;
  imageUrl: string;
};

export function getMockCheckoutLines(): MockCartLine[] {
  const p1 = getMockProduct("cozy-dog-bed")!;
  const p2 = getMockProduct("premium-dog-leash")!;
  const v1 = p1.variants.edges[1]?.node ?? p1.variants.edges[0]!.node;
  const v2 = p2.variants.edges[0]!.node;
  return [
    {
      id: "line-1",
      title: p1.title,
      variantTitle: v1.title,
      quantity: 1,
      unitPrice: v1.price,
      imageUrl: p1.images.edges[0]!.node.url,
    },
    {
      id: "line-2",
      title: p2.title,
      variantTitle: v2.title,
      quantity: 2,
      unitPrice: v2.price,
      imageUrl: p2.images.edges[0]!.node.url,
    },
  ];
}
