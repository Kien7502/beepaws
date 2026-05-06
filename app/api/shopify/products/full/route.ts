import { NextRequest, NextResponse } from "next/server";

import { hasAdminApiCredentials } from "@/lib/shopify/admin-credentials";
import { adminGetFullProductsForPage } from "@/lib/shopify/admin-product-page";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!hasAdminApiCredentials()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Missing Shopify Admin credentials. Set SHOPIFY_ADMIN_ACCESS_TOKEN (and store domain env).",
      },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle")?.trim() || undefined;
  const firstParam = searchParams.get("first");
  const first = firstParam ? Number(firstParam) : undefined;

  try {
    const products = await adminGetFullProductsForPage({
      handle,
      first: Number.isFinite(first) ? first : undefined,
    });

    return NextResponse.json({
      ok: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET /api/shopify/products/full failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch full products from Shopify Admin API.",
      },
      { status: 500 },
    );
  }
}
