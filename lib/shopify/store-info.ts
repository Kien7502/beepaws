import "server-only";

import { adminGraphqlFetch } from "./admin-graphql";
import { hasAdminApiCredentials } from "./admin-credentials";

// Store details authored in the admin (Settings → Store details, 2026-10-21):
// today the support email on the contact page. Shop metafield
// `beepaws.store_info`; the admin refreshes the "store" cache tag on save.
// CROSS-REPO CONTRACT: keep sanitizeStoreInfo in step with
// ../beepaws-admin/lib/store-info.ts.

export type StoreInfo = { supportEmail: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeStoreInfo(raw: unknown): StoreInfo {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const email = typeof o.supportEmail === "string" ? o.supportEmail.trim().slice(0, 200) : "";
  return { supportEmail: EMAIL.test(email) ? email : "" };
}

/** The saved store details; nothing set (or no Admin credentials) → empty fields. */
export async function getStoreInfo(): Promise<StoreInfo> {
  if (!hasAdminApiCredentials()) return sanitizeStoreInfo(null);
  try {
    const res = await adminGraphqlFetch<{ data?: { shop?: { metafield?: { value?: string } | null } } }>({
      query: `{ shop { metafield(namespace: "beepaws", key: "store_info") { value } } }`,
      cache: "force-cache",
      tags: ["store"],
    });
    const raw = res.body.data?.shop?.metafield?.value;
    return sanitizeStoreInfo(raw ? JSON.parse(raw) : null);
  } catch {
    return sanitizeStoreInfo(null);
  }
}
