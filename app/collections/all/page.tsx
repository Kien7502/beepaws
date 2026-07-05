import { Suspense } from "react";
import { getProducts } from "@/lib/shopify/queries";
import { hasAdminApiCredentials } from "@/lib/shopify/admin-credentials";
import ProductCard from "@/components/product/ProductCard";
import SortDropdown from "@/components/product/SortDropdown";
import { SORT_OPTIONS, type SortValue } from "@/components/product/sort-config";
import type { Product } from "@/types/shopify";
import Link from "next/link";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Shop All | Beepaws",
  description: "Shop all premium pet supplies and accessories at Beepaws.",
};

// ISR: revalidate via webhook → revalidateTag("products")
// Fallback: re-generate every 1 hour without a webhook push
export const revalidate = 3600;

function parseSortParam(raw: unknown): SortValue {
  const allowed = SORT_OPTIONS.map((o) => o.value) as string[];
  const s = typeof raw === "string" ? raw : "featured";
  return (allowed.includes(s) ? s : "featured") as SortValue;
}

function sortProducts(products: Product[], sort: SortValue): Product[] {
  if (sort === "price-asc" || sort === "price-desc") {
    const asc = sort === "price-asc";
    return [...products].sort((a, b) => {
      const pa = parseFloat(a.priceRange.minVariantPrice.amount);
      const pb = parseFloat(b.priceRange.minVariantPrice.amount);
      return asc ? pa - pb : pb - pa;
    });
  }
  return products;
}

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export default async function ShopAllPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const sort = parseSortParam(resolvedParams.sort);

  const option = SORT_OPTIONS.find((o) => o.value === sort)!;

  // Price sort is handled client-side after fetch (Admin API products endpoint
  // doesn't expose PRICE as a sort key outside of a collection context).
  const fetchSortKey =
    sort === "price-asc" || sort === "price-desc" ? undefined : option.sortKey;
  const fetchReverse =
    sort === "price-asc" || sort === "price-desc" ? false : option.reverse;

  const hasCreds = hasAdminApiCredentials();
  const rawProducts = await getProducts({
    sortKey: fetchSortKey,
    reverse: fetchReverse,
  });
  // Hide Shopify bundle products (tagged `bundle`) from the catalog grid - they
  // sell via their own page / a cross-sell on component PDPs, not mixed in here.
  const products = sortProducts(
    rawProducts.filter((p) => !p.tags?.includes("bundle")),
    sort,
  );

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-7xl section-y">
      {/* Page header + sort bar */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-foreground)] tracking-tight">
            All products
          </h1>
          {products.length > 0 && (
            <p className="mt-1 text-sm text-[var(--color-accent)]/70">
              {products.length} item{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {products.length > 0 && (
          <Suspense fallback={null}>
            <SortDropdown current={sort} />
          </Suspense>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 px-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-[var(--color-foreground)]">
            No products found
          </h2>
          <p className="text-[var(--color-accent)]/70 mb-8">
            {hasCreds
              ? "Admin credentials detected, but catalog returned empty. Ensure products are ACTIVE in your Shopify store."
              : "Missing Shopify Admin credentials. Set SHOPIFY_ADMIN_ACCESS_TOKEN and store domain env vars."}
          </p>
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.handle}
              handle={product.handle}
              title={product.title}
              price={formatPrice(
                product.priceRange.minVariantPrice.amount,
                product.priceRange.minVariantPrice.currencyCode,
              )}
              imageUrl={product.images?.edges[0]?.node?.url ?? "/product-placeholder.svg"}
              product={product}
              priority={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
