import { NextResponse } from "next/server";
import {
  createCartWithLines,
  SHOPIFY_CART_COOKIE,
} from "@/lib/shopify/storefront-cart";
import { buildStorefrontCartPermalinkFromLines } from "@/lib/shopify/cart-permalink";

const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const SELLING_PLAN_GID = /^gid:\/\/shopify\/SellingPlan\/\d+$/;

export async function POST(req: Request) {
  let body:
    | {
        merchandiseId?: string;
        quantity?: number;
        lines?: { merchandiseId?: string; quantity?: number; sellingPlanId?: string }[];
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
          sellingPlanId: line.sellingPlanId?.trim() || undefined,
        }))
        .filter((line) => line.merchandiseId)
    : body?.merchandiseId
      ? [
          {
            merchandiseId: body.merchandiseId.trim(),
            quantity: typeof body.quantity === "number" ? body.quantity : 1,
            sellingPlanId: undefined as string | undefined,
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
  if (lines.some((line) => line.sellingPlanId && !SELLING_PLAN_GID.test(line.sellingPlanId))) {
    return NextResponse.json(
      { error: "sellingPlanId must be gid://shopify/SellingPlan/{numericId}" },
      { status: 400 },
    );
  }

  try {
    // Fresh cart with exactly the posted lines. The old flow merged into a
    // cart persisted in a 14-day cookie — every buy-now stacked onto all the
    // previous ones, so Shopify checkout showed items from earlier sessions.
    const { cartId, checkoutUrl } = await createCartWithLines(lines);

    const res = NextResponse.json({ checkoutUrl, cartId });
    // Clear the legacy merge-cart cookie so the stale accumulated cart is
    // permanently unreachable.
    res.cookies.delete(SHOPIFY_CART_COOKIE);
    return res;
  } catch (e) {
    // Fallback: use Online Store cart permalink even if Storefront API fails.
    const storeOrigin =
      process.env.NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL ||
      process.env.SHOPIFY_SHOP_DOMAIN ||
      process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const fallbackUrl = buildStorefrontCartPermalinkFromLines(storeOrigin, lines);
    if (fallbackUrl) {
      return NextResponse.json({ checkoutUrl: fallbackUrl, fallback: true });
    }
    const msg = e instanceof Error ? e.message : "Cart error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
