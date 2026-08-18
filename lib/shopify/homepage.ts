import "server-only";

import { unstable_cache } from "next/cache";
import { adminGraphqlFetch } from "./admin-graphql";
import { hasAdminApiCredentials } from "./admin-credentials";

// Homepage image blocks authored in the admin tool (handoff 2026-08-15,
// docs/admin-handoff-homepage.md). ONE shop metafield `beepaws.homepage` holds
// an ordered list of blocks; the homepage maps each block to a SLOT by its
// `key` (not array index) and renders its image + optional heading/body/CTA,
// falling back to the hardcoded content when a key is absent. Absent/empty
// metafield = today's fully hardcoded homepage.
//
// Treat the metafield as UNTRUSTED — re-apply the admin's validation here
// (slugify/unique keys, verify the image host, coerce strings), never trust
// the stored JSON. Same read+validate+cache shape as variant-groups.ts.

/** The set of slot keys the homepage actually consumes. Published back to the
 * admin so its keys match (handoff §"what the storefront builds"). A block with
 * any other key is kept but simply never rendered (no slot claims it). */
export const HOMEPAGE_KEYS = [
  "hero",
  "healthy-home",
  "why-scene",
  "proof-1",
  "proof-2",
  "proof-3",
  "dental-spotlight",
] as const;
export type HomepageKey = (typeof HOMEPAGE_KEYS)[number];

export interface HomepageBlock {
  key: string;
  /** Shopify CDN image URL, or "" for a text-only block. */
  image: string;
  /** Accessible alt text for the image ("" allowed). */
  alt: string;
  /** Optional plain-text overrides (never HTML — render through the storefront's
   * own typography). `body` may contain \n line breaks. */
  heading?: string;
  body?: string;
  /** Rendered as a link/button only when BOTH are present. `ctaHref` is an
   * internal path (/products/…) or an absolute URL. */
  ctaLabel?: string;
  ctaHref?: string;
}

/** key → block, ready for slot lookup. */
export type HomepageBlocks = Partial<Record<string, HomepageBlock>>;

type HomepageBody = {
  data?: { shop?: { metafield?: { value?: string } | null } };
};

const HOMEPAGE_QUERY = `
  query BeePawsHomepage {
    shop { metafield(namespace: "beepaws", key: "homepage") { value } }
  }
`;

// ─── Validation (mirror of the admin's sanitizeHomepage) ────────────────────

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Slugify to the admin's rule: lowercase [a-z0-9-], collapse runs, ≤48 chars. */
function slugifyKey(v: unknown): string {
  return asString(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Only Shopify CDN images are trusted (the admin uploads there). Anything else
 * — including a plausible-looking off-host URL — is dropped to "". */
function safeImage(v: unknown): string {
  const url = asString(v).trim();
  if (!url) return "";
  try {
    return new URL(url).hostname === "cdn.shopify.com" ? url : "";
  } catch {
    return "";
  }
}

/** Trim; empty → undefined so callers can `?? fallback`. */
function optText(v: unknown): string | undefined {
  const s = asString(v).trim();
  return s ? s : undefined;
}

/** ctaHref: an internal path or an http(s) URL. Anything else (javascript:,
 * mailto oddities, garbage) is dropped so a CTA can't become an injection. */
function safeHref(v: unknown): string | undefined {
  const s = asString(v).trim();
  if (!s) return undefined;
  if (s.startsWith("/")) return s;
  try {
    const proto = new URL(s).protocol;
    return proto === "https:" || proto === "http:" ? s : undefined;
  } catch {
    return undefined;
  }
}

export function sanitizeHomepage(raw: unknown): HomepageBlocks {
  const blocksRaw = (raw as { blocks?: unknown })?.blocks;
  if (!Array.isArray(blocksRaw)) return {};

  const out: HomepageBlocks = {};
  for (const b of blocksRaw) {
    if (!b || typeof b !== "object") continue;
    const rec = b as Record<string, unknown>;
    const key = slugifyKey(rec.key);
    if (!key) continue;
    if (out[key]) continue; // de-dup: first wins

    const ctaLabel = optText(rec.ctaLabel);
    const ctaHref = safeHref(rec.ctaHref);
    out[key] = {
      key,
      image: safeImage(rec.image),
      alt: asString(rec.alt).trim(),
      heading: optText(rec.heading),
      body: optText(rec.body),
      // A CTA needs BOTH halves — one without the other renders nothing.
      ...(ctaLabel && ctaHref ? { ctaLabel, ctaHref } : {}),
    };
  }
  return out;
}

// ─── Fetch + cache ──────────────────────────────────────────────────────────

async function fetchHomepageBlocks(): Promise<HomepageBlocks> {
  if (!hasAdminApiCredentials()) return {};
  try {
    const res = await adminGraphqlFetch<HomepageBody>({ query: HOMEPAGE_QUERY });
    const value = res.body.data?.shop?.metafield?.value;
    if (!value) return {};
    return sanitizeHomepage(JSON.parse(value));
  } catch {
    // Never a page blocker: no data / bad JSON = the hardcoded homepage.
    return {};
  }
}

// Admin GraphQL is POST (no fetch-level caching), so wrap like the catalog
// queries — passthrough in dev so admin publishes show on the next request.
const cached =
  process.env.NODE_ENV === "production"
    ? unstable_cache(fetchHomepageBlocks, ["beepaws-homepage"], {
        tags: ["homepage"],
        revalidate: 3600,
      })
    : fetchHomepageBlocks;

export function getHomepageBlocks(): Promise<HomepageBlocks> {
  return cached();
}

/**
 * Published blocks read FRESH, bypassing `unstable_cache`.
 *
 * Used by the preview route's `published` mode: the live homepage is ISR-cached
 * for an hour, so a draft-vs-live comparison built on the cached read could show
 * hour-old content and lie about what is actually published. A comparison view
 * is only worth having if the "live" side is genuinely live.
 */
export function getPublishedHomepageBlocksUncached(): Promise<HomepageBlocks> {
  return fetchHomepageBlocks();
}
