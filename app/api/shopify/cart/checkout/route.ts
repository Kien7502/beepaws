import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  mergeCartAndGetCheckoutUrl,
  SHOPIFY_CART_COOKIE,
} from "@/lib/shopify/storefront-cart";

const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

export async function POST(req: Request) {
  let body: { merchandiseId?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const merchandiseId = body.merchandiseId?.trim();
  const quantity = typeof body.quantity === "number" ? body.quantity : 1;

  if (!merchandiseId || !VARIANT_GID.test(merchandiseId)) {
    return NextResponse.json(
      {
        error:
          "merchandiseId must be gid://shopify/ProductVariant/{numericId}",
      },
      { status: 400 },
    );
  }

  if (quantity < 1 || quantity > 99) {
    return NextResponse.json({ error: "quantity must be 1–99" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(SHOPIFY_CART_COOKIE)?.value;

  try {
    const { cartId, checkoutUrl } = await mergeCartAndGetCheckoutUrl(
      existing,
      merchandiseId,
      quantity,
    );

    const res = NextResponse.json({ checkoutUrl, cartId });
    res.cookies.set(SHOPIFY_CART_COOKIE, cartId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cart error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
