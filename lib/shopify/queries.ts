import "server-only";

import { unstable_cache } from "next/cache";
import {
  adminGetCollections,
  adminGetProductByHandle,
  adminGetProducts,
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
const REVALIDATE = 3600;

type GetProductsOpts = {
  collectionHandle?: string;
  query?: string;
  reverse?: boolean;
  sortKey?: string;
};

const _getCachedCollections = unstable_cache(
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

const _getCachedProducts = unstable_cache(
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

const _getCachedProduct = unstable_cache(
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

const _getCachedFullProduct = unstable_cache(
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
