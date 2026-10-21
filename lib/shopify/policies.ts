import "server-only";

import { shopifyFetch } from "./index";

// The legal policies the owner keeps in Shopify (Settings → Policies), shown on
// this site at /policies/<handle> and linked from the footer (2026-10-21). They
// are edited in Shopify, never here, so the page and Shopify's checkout always
// show the same text. Only the ones this site doesn't already cover with its
// own page: shipping and returns live at /shipping and /returns.
export const LEGAL_POLICIES = [
  { handle: "privacy-policy", field: "privacyPolicy", label: "Privacy Policy" },
  { handle: "terms-of-service", field: "termsOfService", label: "Terms of Service" },
] as const;

export type LegalHandle = (typeof LEGAL_POLICIES)[number]["handle"];
export type ShopPolicy = { title: string; body: string };

type Raw = { data?: { shop?: Record<string, { title?: string; body?: string } | null> } };

/** The legal policies that are set in Shopify, by handle. Re-checked hourly
 *  (Shopify has no webhook for policy edits); any failure → none. */
export async function getLegalPolicies(): Promise<Partial<Record<LegalHandle, ShopPolicy>>> {
  try {
    const fields = LEGAL_POLICIES.map((p) => `${p.field} { title body }`).join(" ");
    const res = await shopifyFetch<Raw>({ query: `{ shop { ${fields} } }`, tags: ["store"], revalidate: 3600, silent: true });
    const shop = res.body.data?.shop ?? {};
    const out: Partial<Record<LegalHandle, ShopPolicy>> = {};
    for (const p of LEGAL_POLICIES) {
      const v = shop[p.field];
      if (v?.title && v.body?.trim()) out[p.handle] = { title: v.title, body: v.body };
    }
    return out;
  } catch {
    return {};
  }
}
