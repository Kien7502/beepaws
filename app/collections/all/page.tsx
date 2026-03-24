import { getProducts } from "@/lib/shopify/queries";
import ProductCard from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import Link from "next/link";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Shop All | Beepaws",
  description: "Shop all premium pet supplies and accessories at Beepaws.",
};

export default async function ShopAllPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All products" }]} />

      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-foreground)] mb-4 tracking-tight">
          All products
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
          Explore our full catalog—curated for comfort, play, and everyday care.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 px-4 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-[var(--color-foreground)]">
            No products found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Connect your Shopify store or check your Storefront API settings. Demo
            data appears when the catalog is unavailable.
          </p>
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => {
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
                  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop"
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
