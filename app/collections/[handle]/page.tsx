import { getProducts } from "@/lib/shopify/queries";
import { withoutVariantGroupMembers } from "@/lib/shopify/variant-groups";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";
import Link from "next/link";
import {
  formatCollectionTitle,
  getCollectionSubtitle,
} from "@/lib/format-collection";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = await params;
  const title = formatCollectionTitle(resolvedParams.handle);
  return {
    title: `${title} | Beepaws`,
    description: `Shop ${title.toLowerCase()} — premium pet supplies at Beepaws.`,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = await params;
  const collectionHandle = resolvedParams.handle;
  // Hide Shopify bundle products (tagged `bundle`) from collection grids, and
  // collapse variant groups to their primary (contract §3) so flavours of one
  // product don't appear as near-duplicate rows.
  const products = await withoutVariantGroupMembers(
    (await getProducts({ collectionHandle })).filter((p) => !p.tags?.includes("bundle")),
  );

  const title = formatCollectionTitle(collectionHandle);
  const subtitle =
    getCollectionSubtitle(collectionHandle) ??
    `Curated products in our ${title.toLowerCase()} range.`;

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-7xl section-y">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-foreground)] mb-4 tracking-tight">
          {title}
        </h1>
        <p className="text-[var(--color-accent)]/70 text-lg leading-relaxed">
          {subtitle}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-[var(--color-secondary)]/30 border-2 border-dashed border-[var(--color-primary)]/25 rounded-2xl text-center max-w-xl mx-auto">
          <span className="text-6xl mb-6 opacity-80" aria-hidden>
            🐾
          </span>
          <h2 className="text-2xl md:text-3xl font-black mb-3 text-[var(--color-foreground)]">
            No products here yet
          </h2>
          <p className="text-[var(--color-accent)]/70 text-lg mb-8 max-w-md">
            We could not find products in this collection. Browse the full catalog
            or try another category.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/collections/all" className="w-full sm:w-auto">
              <Button fullWidth className="sm:w-auto">
                Shop all products
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" fullWidth className="sm:w-auto">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product, index) => {
            const price = parseFloat(product.priceRange.minVariantPrice.amount);
            const formattedPrice = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: product.priceRange.minVariantPrice.currencyCode,
            }).format(price);

            return (
              <ProductCard
                key={product.handle}
                handle={product.handle}
                title={product.title}
                price={formattedPrice}
                imageUrl={
                  product.images?.edges[0]?.node?.url ||
                  "/product-placeholder.svg"
                }
                product={product}
                priority={index === 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
