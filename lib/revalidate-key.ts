import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Who may trigger /api/revalidate's manual path (2026-10-01).
//
// The admin tool refreshes this site after every Push / Publish. That needs a
// shared key, and a shared key normally has to be SENT from one side to the
// other - which the owner didn't want to do. But both sides already hold the same
// Shopify app's client secret (the admin and this storefront are one app), so
// each derives the key from it independently: an HMAC, one-way, so the key
// reveals nothing about the client secret, and rotating that secret rotates the
// key on both sides at once. Nothing to configure, nothing to send.
//
// An explicit REVALIDATE_SECRET still works too (e.g. for a manual curl).
//
// KEEP IN SYNC with beepaws-admin/lib/live-refresh.ts (same label, same HMAC).
const LABEL = "beepaws:revalidate:v1";

export function derivedRevalidateKey(): string | null {
  const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim();
  return clientSecret ? createHmac("sha256", clientSecret).update(LABEL).digest("hex") : null;
}

export function isValidRevalidateKey(given: string | null | undefined): boolean {
  if (!given) return false;
  const accepted = [process.env.REVALIDATE_SECRET?.trim(), derivedRevalidateKey()].filter(
    (k): k is string => !!k,
  );
  return accepted.some((k) => safeEqual(k, given));
}

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}
