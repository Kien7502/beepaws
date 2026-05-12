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

// Shopify Admin GraphQL uses POST — Next.js cannot cache POST at the fetch() level.
// unstable_cache wraps the whole function and is invalidated via revalidateTag("products").
// Each cached variant also has a direct-fetch fallback in case the cache layer throws
// (e.g. incrementalCache not yet initialised on first cold start).
const REVALIDATE = 3600;

type GetProductsOpts = {
  collectionHandle?: string;
  query?: string;
  reverse?: boolean;
  sortKey?: string;
};

// ─── unstable_cache wrappers ──────────────────────────────────────────────────

const _cachedGetCollections = unstable_cache(
  async (): Promise<Collection[]> => {
    if (!hasAdminApiCredentials()) return [];
    try {
      return await adminGetCollections();
    } catch (e) {
      console.error("[shopify] collections fetch failed:", e);
      return [];
    }
  },
  ["shopify-collections"],
  { tags: ["collections"], revalidate: REVALIDATE },
);

const _cachedGetProducts = unstable_cache(
  async (opts: GetProductsOpts): Promise<Product[]> => {
    if (!hasAdminApiCredentials()) return [];
    try {
      return await adminGetProducts(opts);
    } catch (e) {
      console.error("[shopify] products fetch failed:", e);
      return [];
    }
  },
  ["shopify-products"],
  { tags: ["products"], revalidate: REVALIDATE },
);

const _cachedGetProduct = unstable_cache(
  async (handle: string): Promise<Product | null> => {
    if (!hasAdminApiCredentials()) return null;
    try {
      return (await adminGetProductByHandle(handle)) ?? null;
    } catch (e) {
      console.error("[shopify] product fetch failed:", e);
      return null;
    }
  },
  ["shopify-product"],
  { tags: ["products"], revalidate: REVALIDATE },
);

const _cachedGetFullProduct = unstable_cache(
  async (handle: string): Promise<AdminFullProductForPage | null> => {
    if (!hasAdminApiCredentials()) return null;
    try {
      const products = await adminGetFullProductsForPage({ handle });
      return products[0] ?? null;
    } catch (e) {
      console.error("[shopify] full product fetch failed:", e);
      return null;
    }
  },
  ["shopify-product-full"],
  { tags: ["products", "product-full"], revalidate: REVALIDATE },
);

// ─── Direct-fetch fallbacks (no cache layer) ──────────────────────────────────

async function _directGetCollections(): Promise<Collection[]> {
  if (!hasAdminApiCredentials()) return [];
  try { return await adminGetCollections(); } catch { return []; }
}

async function _directGetProducts(opts: GetProductsOpts): Promise<Product[]> {
  if (!hasAdminApiCredentials()) return [];
  try { return await adminGetProducts(opts); } catch { return []; }
}

async function _directGetProduct(handle: string): Promise<Product | undefined> {
  if (!hasAdminApiCredentials()) return undefined;
  try { return await adminGetProductByHandle(handle); } catch { return undefined; }
}

async function _directGetFullProduct(handle: string): Promise<AdminFullProductForPage | undefined> {
  if (!hasAdminApiCredentials()) return undefined;
  try {
    const products = await adminGetFullProductsForPage({ handle });
    return products[0];
  } catch { return undefined; }
}

// ─── Public API (cache with direct-fetch fallback) ───────────────────────────

export async function getCollections(): Promise<Collection[]> {
  try {
    return await _cachedGetCollections();
  } catch {
    return _directGetCollections();
  }
}

export async function getProducts(opts: GetProductsOpts = {}): Promise<Product[]> {
  try {
    return await _cachedGetProducts(opts);
  } catch {
    return _directGetProducts(opts);
  }
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  try {
    return (await _cachedGetProduct(handle)) ?? undefined;
  } catch {
    return _directGetProduct(handle);
  }
}

export async function getFullProductForPage(
  handle: string,
): Promise<AdminFullProductForPage | undefined> {
  try {
    return (await _cachedGetFullProduct(handle)) ?? undefined;
  } catch {
    return _directGetFullProduct(handle);
  }
}
