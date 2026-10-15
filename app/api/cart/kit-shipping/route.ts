import { NextResponse } from "next/server";
import { ensureKitShippingCode } from "@/lib/shopify/kit-shipping";

// The browser cart calls this after every change and right before checkout:
// it attaches, renews or removes the cart's free-shipping-on-kits code
// (lib/shopify/kit-shipping.ts). The server reads the cart itself and only
// ever creates a code for a cart that holds a kit — the id is all it takes.
const CART_GID = /^gid:\/\/shopify\/Cart\/[A-Za-z0-9_-]+(\?key=[A-Za-z0-9]+)?$/;

// Per-visitor throttle: a shopper changes their cart a handful of times a
// minute, a script hammering this route doesn't. Best effort — counted per
// server instance (serverless instances don't share memory); the store-wide
// cap on live codes (lib/shopify/kit-shipping.ts) is the hard limit.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (throttled(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let cartId = "";
  try {
    cartId = String(((await req.json()) as { cartId?: unknown }).cartId ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!CART_GID.test(cartId)) return NextResponse.json({ error: "cartId must be a Shopify cart id" }, { status: 400 });
  try {
    return NextResponse.json({ kitShipping: await ensureKitShippingCode(cartId) });
  } catch (e) {
    // Never block the cart over this: no code just means standard shipping.
    console.warn("[kit-shipping]", e instanceof Error ? e.message : e);
    return NextResponse.json({ kitShipping: null, error: "kit shipping unavailable" }, { status: 200 });
  }
}
