import { createHmac, timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// ─── HMAC verification ────────────────────────────────────────────────────────
// Shopify signs every webhook with HMAC-SHA256 using your webhook secret.
// Never skip this check — any HTTP client could hit this endpoint otherwise.

function verifyShopifyHmac(rawBody: string, signature: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  try {
    const expected = createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ─── Tag map ──────────────────────────────────────────────────────────────────
// Maps Shopify webhook topics → Next.js cache tags to invalidate.

const TOPIC_TAG_MAP: Record<string, string[]> = {
  "products/create":   ["products"],
  "products/update":   ["products"],
  "products/delete":   ["products"],
  "inventory_levels/update": ["products"],
  "collections/create": ["collections", "products"],
  "collections/update": ["collections", "products"],
  "collections/delete": ["collections", "products"],
};

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const topic = req.headers.get("x-shopify-topic") ?? "";

  // ── Path A: Shopify webhook (verified by HMAC) ──────────────────────────
  if (hmacHeader) {
    if (!verifyShopifyHmac(rawBody, hmacHeader)) {
      return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 });
    }

    const tags = TOPIC_TAG_MAP[topic] ?? ["products"];
    for (const tag of tags) revalidateTag(tag, "max");

    return NextResponse.json({
      revalidated: true,
      topic,
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Path B: Manual trigger via secret query param ───────────────────────
  // Usage: POST /api/revalidate?secret=YOUR_REVALIDATE_SECRET&tag=products
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const manualSecret = process.env.REVALIDATE_SECRET?.trim();

  if (!manualSecret || secret !== manualSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tag = url.searchParams.get("tag") ?? "products";
  const allowedTags = ["products", "collections"];
  if (!allowedTags.includes(tag)) {
    return NextResponse.json({ error: `tag must be one of: ${allowedTags.join(", ")}` }, { status: 400 });
  }

  revalidateTag(tag, "max");
  return NextResponse.json({
    revalidated: true,
    tag,
    timestamp: new Date().toISOString(),
  });
}

// ─── GET handler (health check) ───────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Revalidation endpoint ready. POST with Shopify webhook or ?secret=xxx&tag=products.",
  });
}
