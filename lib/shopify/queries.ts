import "server-only";

import { unstable_cache } from "next/cache";
import {
  adminGetProductByHandle,
  adminGetProducts,
} from "./admin-catalog";
import {
  adminGetFullProductsForPage,
  type AdminFullProductForPage,
} from "./admin-product-page";
import { hasAdminApiCredentials } from "./admin-credentials";
import type { Product } from "@/types/shopify";

// Shopify Admin GraphQL uses POST — Next.js cannot cache POST at the fetch() level.
// unstable_cache wraps the whole function and is invalidated via revalidateTag("products").
// Each cached variant also has a direct-fetch fallback in case the cache layer throws
// (e.g. incrementalCache not yet initialised on first cold start).
// The `cache()` helper below passes through in DEV so Shopify edits (and the admin's
// live preview) appear on the very next request instead of waiting for a revalidate.
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

// ─── cache wrappers (pass through in dev — see cache() above) ────────────────
//
// A failed read must THROW, never come back as "nothing" (2026-10-21).
// unstable_cache stores whatever its function returns, and these used to catch
// errors and return [] / null — so one Shopify timeout during a build was
// cached as "this product has no content": the PDP rendered its Lorem
// placeholders and Next kept that page for an hour. Now only a real "not found"
// returns empty; an error skips the cache, gets retried uncached, and if it
// still fails, throws — a build then stops (the previous deploy stays live) and
// a background revalidation keeps serving the last good page.

const _cachedGetProducts = cache(
  async (opts: GetProductsOpts): Promise<Product[]> =>
    hasAdminApiCredentials() ? adminGetProducts(opts) : [],
  ["shopify-products"],
  { tags: ["products"], revalidate: REVALIDATE },
);

const _cachedGetProduct = cache(
  async (handle: string): Promise<Product | null> =>
    hasAdminApiCredentials() ? ((await adminGetProductByHandle(handle)) ?? null) : null,
  ["shopify-product"],
  { tags: ["products"], revalidate: REVALIDATE },
);

const _cachedGetFullProduct = cache(
  async (handle: string): Promise<AdminFullProductForPage | null> =>
    hasAdminApiCredentials() ? ((await adminGetFullProductsForPage({ handle }))[0] ?? null) : null,
  ["shopify-product-full"],
  { tags: ["products", "product-full"], revalidate: REVALIDATE },
);

/** Up to 3 tries with a short backoff (0.5s, 1s); rethrows the last error. */
async function retry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
  console.error(`[shopify] ${label} failed after 3 tries:`, last);
  throw last;
}

// ─── Public API (cache, then an uncached retry) ──────────────────────────────

/** The catalog. Never throws: a Shopify failure returns [] for THIS request
 *  only (nothing is cached) — its callers (prebuilding product pages, the
 *  collection pages) degrade to "no list" rather than a broken page. */
export async function getProducts(opts: GetProductsOpts = {}): Promise<Product[]> {
  try {
    return await _cachedGetProducts(opts);
  } catch {
    try {
      return await retry("products fetch", async () => (hasAdminApiCredentials() ? adminGetProducts(opts) : []));
    } catch {
      return [];
    }
  }
}

/** One product; undefined = it doesn't exist. THROWS when Shopify can't be read. */
export async function getProduct(handle: string): Promise<Product | undefined> {
  try {
    return (await _cachedGetProduct(handle)) ?? undefined;
  } catch {
    return retry(`product ${handle}`, async () =>
      hasAdminApiCredentials() ? await adminGetProductByHandle(handle) : undefined,
    );
  }
}

/** A product's page content; undefined = no such product. THROWS when Shopify
 *  can't be read — so a product page never renders its placeholders by accident. */
export async function getFullProductForPage(
  handle: string,
): Promise<AdminFullProductForPage | undefined> {
  try {
    return (await _cachedGetFullProduct(handle)) ?? undefined;
  } catch {
    return retry(`full product ${handle}`, async () =>
      hasAdminApiCredentials() ? (await adminGetFullProductsForPage({ handle }))[0] : undefined,
    );
  }
}

// UNCACHED reads for the admin's live preview. Same reasoning as
// getPublishedHomepageBlocksUncached: a preview built on the cached read shows
// stale content (an image uploaded a second ago wouldn't appear until
// revalidateTag("products")), which looks like a broken preview.
export async function getProductUncached(handle: string): Promise<Product | undefined> {
  if (!hasAdminApiCredentials()) return undefined;
  try {
    return await adminGetProductByHandle(handle, true);
  } catch (e) {
    console.error("Admin GraphQL product (uncached) failed", e);
    return undefined;
  }
}

export async function getFullProductForPageUncached(
  handle: string,
): Promise<AdminFullProductForPage | undefined> {
  if (!hasAdminApiCredentials()) return undefined;
  try {
    const products = await adminGetFullProductsForPage({ handle, fresh: true });
    return products[0];
  } catch (e) {
    console.error("Admin GraphQL full product (uncached) failed", e);
    return undefined;
  }
}

