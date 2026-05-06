import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mergeCartAndGetCheckoutUrl,
  SHOPIFY_CART_COOKIE,
} from "@/lib/shopify/storefront-cart";
import { buildStorefrontCartPermalinkFromLines } from "@/lib/shopify/cart-permalink";

const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

export async function POST(req: Request) {
  let body:
    | {
        merchandiseId?: string;
        quantity?: number;
        lines?: { merchandiseId?: string; quantity?: number }[];
      }
    | undefined;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lines = Array.isArray(body?.lines)
    ? body.lines
        .map((line) => ({
          merchandiseId: line.merchandiseId?.trim() || "",
          quantity: typeof line.quantity === "number" ? line.quantity : 1,
        }))
        .filter((line) => line.merchandiseId)
    : body?.merchandiseId
      ? [
          {
            merchandiseId: body.merchandiseId.trim(),
            quantity: typeof body.quantity === "number" ? body.quantity : 1,
          },
        ]
      : [];

  if (!lines.length) {
    return NextResponse.json({ error: "Provide merchandiseId or lines[]" }, { status: 400 });
  }
  if (lines.some((line) => !VARIANT_GID.test(line.merchandiseId))) {
    return NextResponse.json(
      { error: "Each merchandiseId must be gid://shopify/ProductVariant/{numericId}" },
      { status: 400 },
    );
  }
  if (lines.some((line) => line.quantity < 1 || line.quantity > 99)) {
    return NextResponse.json({ error: "quantity must be 1–99" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(SHOPIFY_CART_COOKIE)?.value;

  try {
    let cartId = existing;
    let checkoutUrl = "";
    for (const line of lines) {
      const merged = await mergeCartAndGetCheckoutUrl(
        cartId,
        line.merchandiseId,
        line.quantity,
      );
      cartId = merged.cartId;
      checkoutUrl = merged.checkoutUrl;
    }

    const res = NextResponse.json({ checkoutUrl, cartId });
    if (cartId) {
      res.cookies.set(SHOPIFY_CART_COOKIE, cartId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  } catch (e) {
    // Fallback: use Online Store cart permalink even if Storefront API fails.
    const storeOrigin =
      process.env.NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL ||
      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const fallbackUrl = buildStorefrontCartPermalinkFromLines(storeOrigin, lines);
    if (fallbackUrl) {
      return NextResponse.json({ checkoutUrl: fallbackUrl, fallback: true });
    }
    const msg = e instanceof Error ? e.message : "Cart error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
