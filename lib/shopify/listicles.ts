import "server-only";

import { unstable_cache } from "next/cache";
import { adminGraphqlFetch } from "./admin-graphql";
import { hasAdminApiCredentials } from "./admin-credentials";
import { getProduct } from "./queries";

// Listicles authored in the admin tool (2026-10-06, docs/admin-handoff-listicles.md):
// editorial landing pages rendered at /journal/<slug>. Each is ONE shop metafield
// in the `beepaws_listicles` namespace — key = the slug, value = the listicle JSON
// in our own format (portable to WooCommerce as-is).
//
// The metafield is UNTRUSTED: re-apply the admin's sanitizer here (lib/listicle.ts
// over there — keep the two in sync), verify the image host, never render HTML.

const NS = "beepaws_listicles"; // KEEP IN SYNC with beepaws-admin/lib/commerce/shopify.ts

export interface ListicleImage {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}

export type ListicleBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; image: ListicleImage }
  | { id: string; type: "quote"; text: string; attribution: string }
  | { id: string; type: "callout"; title: string; text: string }
  | { id: string; type: "cards"; title: string; items: { title: string; text: string; check: string }[] }
  | { id: string; type: "timeline"; title: string; items: { label: string; text: string }[] }
  | { id: string; type: "cta"; style: "button" | "link"; label: string; href: string; note: string }
  | {
      id: string;
      type: "product";
      product: { handle: string; title: string } | null;
      name: string;
      image: ListicleImage;
      contentsTitle: string;
      contents: string[];
      note: string;
      compareLine: string;
      ctaLabel: string;
      ctaHref: string;
      ctaNote: string;
    };

export interface ListicleSection {
  id: string;
  kind: "intro" | "reason" | "plain";
  /** "plain" = on the page; otherwise a full-width light band. */
  tone: "plain" | "white" | "honey";
  heading: string;
  blocks: ListicleBlock[];
}

export interface Listicle {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  topStrip: string;
  headline: string;
  subhead: string;
  byline: { author: string; date: string; readTime: string };
  checklist: string[];
  topCta: { label: string; href: string; note: string };
  hero: ListicleImage;
  sections: ListicleSection[];
  stickyCta: { enabled: boolean; label: string; href: string };
  footer: { line: string; disclaimer: string };
  /** Colour of every ==highlight== on the page. */
  highlight: "honey" | "amber" | "clay" | "brown";
}

// ─── Validation (mirror of the admin's sanitizeListicle) ────────────────────

const str = (v: unknown, max = 20000): string => (typeof v === "string" ? v.slice(0, max) : "");
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const arr = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);

export function slugifyListicle(s: string): string {
  const out = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return out.length >= 2 ? out : "";
}

/** Internal path or http(s) URL; anything else (javascript:, junk) → "". */
function safeHref(v: unknown): string {
  const s = str(v, 2000).trim();
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const p = new URL(s).protocol;
    return p === "https:" || p === "http:" ? s : "";
  } catch {
    return "";
  }
}

/** Only Shopify CDN images are trusted (the admin uploads there). */
function safeImageSrc(v: unknown): string {
  const url = str(v, 2000).trim();
  if (!url) return "";
  try {
    return new URL(url).hostname === "cdn.shopify.com" ? url : "";
  } catch {
    return "";
  }
}

function dim(v: unknown): number | undefined {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 && n < 20000 ? n : undefined;
}

function image(v: unknown): ListicleImage {
  const o = obj(v);
  const out: ListicleImage = { src: safeImageSrc(o.src), alt: str(o.alt, 500), caption: str(o.caption, 500) };
  const w = dim(o.width),
    h = dim(o.height);
  if (out.src && w && h) {
    out.width = w;
    out.height = h;
  }
  return out;
}

const strList = (v: unknown, max = 30) => arr(v, max).map((x) => str(x, 500));

function block(v: unknown, i: number): ListicleBlock | null {
  const o = obj(v);
  const id = str(o.id, 60) || `b-${i}`;
  switch (o.type) {
    case "text":
      return { id, type: "text", text: str(o.text) };
    case "image":
      return { id, type: "image", image: image(o.image) };
    case "quote":
      return { id, type: "quote", text: str(o.text, 4000), attribution: str(o.attribution, 300) };
    case "callout":
      return { id, type: "callout", title: str(o.title, 300), text: str(o.text, 8000) };
    case "cards":
      return {
        id,
        type: "cards",
        title: str(o.title, 300),
        items: arr(o.items, 30).map((x) => {
          const c = obj(x);
          return { title: str(c.title, 300), text: str(c.text, 4000), check: str(c.check, 200) };
        }),
      };
    case "timeline":
      return {
        id,
        type: "timeline",
        title: str(o.title, 300),
        items: arr(o.items, 30).map((x) => {
          const c = obj(x);
          return { label: str(c.label, 200), text: str(c.text, 4000) };
        }),
      };
    case "cta":
      return {
        id,
        type: "cta",
        style: o.style === "link" ? "link" : "button",
        label: str(o.label, 200),
        href: safeHref(o.href),
        note: str(o.note, 300),
      };
    case "product": {
      const p = obj(o.product);
      const handle = str(p.handle, 255).trim();
      return {
        id,
        type: "product",
        product: handle ? { handle, title: str(p.title, 255) } : null,
        name: str(o.name, 300),
        image: image(o.image),
        contentsTitle: str(o.contentsTitle, 200),
        contents: strList(o.contents),
        note: str(o.note, 1000),
        compareLine: str(o.compareLine, 300),
        ctaLabel: str(o.ctaLabel, 200),
        ctaHref: safeHref(o.ctaHref),
        ctaNote: str(o.ctaNote, 300),
      };
    }
    default:
      return null;
  }
}

export function sanitizeListicle(raw: unknown): Listicle {
  const o = obj(raw);
  const by = obj(o.byline),
    top = obj(o.topCta),
    sticky = obj(o.stickyCta),
    foot = obj(o.footer);
  return {
    slug: slugifyListicle(str(o.slug, 200)),
    seoTitle: str(o.seoTitle, 300),
    seoDescription: str(o.seoDescription, 500),
    topStrip: str(o.topStrip, 200),
    headline: str(o.headline, 400),
    subhead: str(o.subhead, 1000),
    byline: { author: str(by.author, 200), date: str(by.date, 100), readTime: str(by.readTime, 100) },
    checklist: strList(o.checklist),
    topCta: { label: str(top.label, 200), href: safeHref(top.href), note: str(top.note, 300) },
    hero: image(o.hero),
    sections: arr(o.sections, 60).map((x, i) => {
      const s = obj(x);
      const kind = s.kind === "intro" || s.kind === "plain" ? s.kind : "reason";
      const tone = s.tone === "white" || s.tone === "honey" ? s.tone : "plain";
      return {
        id: str(s.id, 60) || `s-${i}`,
        kind,
        tone,
        heading: str(s.heading, 400),
        blocks: arr(s.blocks, 60)
          .map(block)
          .filter((b): b is ListicleBlock => !!b),
      };
    }),
    stickyCta: { enabled: sticky.enabled === true, label: str(sticky.label, 200), href: safeHref(sticky.href) },
    footer: { line: str(foot.line, 300), disclaimer: str(foot.disclaimer, 2000) },
    highlight: o.highlight === "amber" || o.highlight === "clay" || o.highlight === "brown" ? o.highlight : "honey",
  };
}

// ─── Fetch + cache ──────────────────────────────────────────────────────────

type OneBody = { data?: { shop?: { metafield?: { value?: string } | null } } };
type ListBody = { data?: { shop?: { metafields?: { nodes?: { key: string }[] } } } };

async function fetchListicle(slug: string): Promise<Listicle | null> {
  if (!hasAdminApiCredentials() || !slugifyListicle(slug)) return null;
  try {
    const res = await adminGraphqlFetch<OneBody>({
      query: `query Listicle($key: String!) { shop { metafield(namespace: "${NS}", key: $key) { value } } }`,
      variables: { key: slug },
    });
    const value = res.body.data?.shop?.metafield?.value;
    if (!value) return null;
    const l = sanitizeListicle(JSON.parse(value));
    return l.headline ? { ...l, slug } : null;
  } catch {
    return null; // unreadable = not found, never a crash
  }
}

async function fetchListicleSlugs(): Promise<string[]> {
  if (!hasAdminApiCredentials()) return [];
  try {
    const res = await adminGraphqlFetch<ListBody>({
      query: `query ListicleSlugs { shop { metafields(namespace: "${NS}", first: 100) { nodes { key } } } }`,
    });
    return (res.body.data?.shop?.metafields?.nodes ?? []).map((n) => n.key).filter((k) => !!slugifyListicle(k));
  } catch {
    return [];
  }
}

// Admin GraphQL is POST (no fetch-level caching), so wrap like the homepage —
// passthrough in dev so a publish shows on the next request. Invalidated by the
// admin's post-publish refresh (tag "listicles").
const prod = process.env.NODE_ENV === "production";
const cachedListicle = prod
  ? unstable_cache(fetchListicle, ["beepaws-listicle"], { tags: ["listicles"], revalidate: 3600 })
  : fetchListicle;
const cachedSlugs = prod
  ? unstable_cache(fetchListicleSlugs, ["beepaws-listicle-slugs"], { tags: ["listicles"], revalidate: 3600 })
  : fetchListicleSlugs;

export function getListicle(slug: string): Promise<Listicle | null> {
  return cachedListicle(slug);
}

export function getListicleSlugs(): Promise<string[]> {
  return cachedSlugs();
}

// ─── Product cards ───────────────────────────────────────────────────────────

/** Price + fallback image for every product a listicle's product cards name,
 *  read from the store at render time (cached with the catalog), so a card can
 *  never show a stale price. A product that can't be read just shows no price. */
export async function listicleProducts(
  l: Listicle,
): Promise<Record<string, { price: string | null; image: ListicleImage | null; title: string }>> {
  const handles = [
    ...new Set(
      l.sections.flatMap((s) => s.blocks.flatMap((b) => (b.type === "product" && b.product ? [b.product.handle] : []))),
    ),
  ];
  const out: Record<string, { price: string | null; image: ListicleImage | null; title: string }> = {};
  await Promise.all(
    handles.map(async (handle) => {
      try {
        const p = await getProduct(handle);
        if (!p) return;
        const m = p.priceRange?.minVariantPrice;
        const img = p.images?.edges?.[0]?.node;
        out[handle] = {
          title: p.title,
          price: m
            ? new Intl.NumberFormat("en-US", { style: "currency", currency: m.currencyCode || "USD" }).format(Number(m.amount))
            : null,
          image: img?.url
            ? { src: img.url, alt: img.altText || p.title, caption: "", width: img.width || undefined, height: img.height || undefined }
            : null,
        };
      } catch {
        /* no price is better than a broken page */
      }
    }),
  );
  return out;
}
