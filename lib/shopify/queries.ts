import "server-only";

import { unstable_cache } from "next/cache";
import {
  adminGetCollections,
  adminGetPaymentMethods,
  adminGetProductByHandle,
  adminGetProducts,
  type PaymentMethods,
} from "./admin-catalog";
import {
  adminGetFullProductsForPage,
  type AdminFullProductForPage,
} from "./admin-product-page";
import { hasAdminApiCredentials } from "./admin-credentials";
import type { Collection, Product } from "@/types/shopify";

// Shopify Admin GraphQL uses POST requests — Next.js cannot cache POST
// at the fetch() level. unstable_cache wraps the whole function instead
// and is invalidated via revalidateTag("products") from the webhook.
// In dev we pass through so Shopify edits appear on the next request.
const REVALIDATE = 3600;
const cache = <Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  keyParts: string[],
  opts: { tags: string[]; revalidate: number },
) =>
  process.env.NODE_ENV === "production"
    ? unstable_cache(fn, keyParts, opts)
    : fn;

type GetProductsOpts = {
  collectionHandle?: string;
  query?: string;
  reverse?: boolean;
  sortKey?: string;
};

const _getCachedCollections = cache(
  async (): Promise<Collection[]> => {
    if (!hasAdminApiCredentials()) return [];
    try {
      return await adminGetCollections();
    } catch (e) {
      console.error("Admin GraphQL collections failed", e);
      return [];
    }
  },
  ["shopify-collections"],
  { tags: ["collections"], revalidate: REVALIDATE },
);

const _getCachedProducts = cache(
  async (opts: GetProductsOpts): Promise<Product[]> => {
    if (!hasAdminApiCredentials()) return [];
    try {
      return await adminGetProducts(opts);
    } catch (e) {
      console.error("Admin GraphQL products failed", e);
      return [];
    }
  },
  ["shopify-products"],
  { tags: ["products"], revalidate: REVALIDATE },
);

const _getCachedProduct = cache(
  async (handle: string): Promise<Product | undefined> => {
    if (!hasAdminApiCredentials()) return undefined;
    try {
      return await adminGetProductByHandle(handle);
    } catch (e) {
      console.error("Admin GraphQL product failed", e);
      return undefined;
    }
  },
  ["shopify-product"],
  { tags: ["products"], revalidate: REVALIDATE },
);

const _getCachedFullProduct = cache(
  async (handle: string): Promise<AdminFullProductForPage | undefined> => {
    if (!hasAdminApiCredentials()) return undefined;
    try {
      const products = await adminGetFullProductsForPage({ handle });
      return products[0];
    } catch (e) {
      console.error("Admin GraphQL full product failed", e);
      return undefined;
    }
  },
  ["shopify-product-full"],
  { tags: ["products", "product-full"], revalidate: REVALIDATE },
);

export function getCollections(): Promise<Collection[]> {
  return _getCachedCollections();
}

export function getProducts(opts: GetProductsOpts = {}): Promise<Product[]> {
  return _getCachedProducts(opts);
}

export function getProduct(handle: string): Promise<Product | undefined> {
  return _getCachedProduct(handle);
}

export function getFullProductForPage(
  handle: string,
): Promise<AdminFullProductForPage | undefined> {
  return _getCachedFullProduct(handle);
}

// Payment methods rarely change — cache for the full revalidate window. Falls
// back to an empty set when credentials are missing so the UI can render
// nothing instead of crashing.
const _getCachedPaymentMethods = cache(
  async (): Promise<PaymentMethods> => {
    if (!hasAdminApiCredentials()) return { cards: [], wallets: [] };
    try {
      return await adminGetPaymentMethods();
    } catch (e) {
      console.error("Admin GraphQL payment methods failed", e);
      return { cards: [], wallets: [] };
    }
  },
  ["shopify-payment-methods"],
  { tags: ["shop"], revalidate: REVALIDATE },
);

export function getPaymentMethods(): Promise<PaymentMethods> {
  return _getCachedPaymentMethods();
}

export type { PaymentMethods };
