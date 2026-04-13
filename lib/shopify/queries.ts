import "server-only";

import {
  adminGetCollections,
  adminGetProductByHandle,
  adminGetProducts,
} from "./admin-catalog";
import { hasAdminApiCredentials } from "./admin-credentials";
import type { Collection, Product } from "@/types/shopify";

/** Catalog qua Shopify GraphQL Admin API (server-only). */
export async function getCollections(): Promise<Collection[]> {
  if (!hasAdminApiCredentials()) {
    return [];
  }

  try {
    return await adminGetCollections();
  } catch (e) {
    console.error("Admin GraphQL collections failed", e);
    return [];
  }
}

export async function getProducts({
  collectionHandle,
  query,
  reverse,
  sortKey,
}: {
  collectionHandle?: string;
  query?: string;
  reverse?: boolean;
  sortKey?: string;
} = {}): Promise<Product[]> {
  if (!hasAdminApiCredentials()) {
    return [];
  }

  try {
    return await adminGetProducts({
      collectionHandle,
      query,
      reverse,
      sortKey,
    });
  } catch (e) {
    console.error("Admin GraphQL products failed", e);
    return [];
  }
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  if (!hasAdminApiCredentials()) {
    return undefined;
  }

  try {
    return await adminGetProductByHandle(handle);
  } catch (e) {
    console.error("Admin GraphQL product failed", e);
    return undefined;
  }
}
