import { NextResponse } from "next/server";
import { ensureKitShippingCode } from "@/lib/shopify/kit-shipping";

// The browser cart calls this after every change and right before checkout:
// it attaches, renews or removes the cart's free-shipping-on-kits code
// (lib/shopify/kit-shipping.ts). The server reads the cart itself and only
// ever creates a code for a cart that holds a kit — the id is all it takes.
const CART_GID = /^gid:\/\/shopify\/Cart\/[A-Za-z0-9_-]+(\?key=[A-Za-z0-9]+)?$/;

export async function POST(req: Request) {
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
