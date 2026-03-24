import { getProducts } from '@/lib/shopify/queries';
import ProductCard from '@/components/product/ProductCard';

export const metadata = {
  title: 'Shop All | Beepaws',
  description: 'Shop all premium pet supplies and accessories at Beepaws.',
};

export default async function ShopAllPage() {
  // Use Shopify query to fetch products. We don't have a specific collection so we fetch all
  // In a real store, we might fetch a "catalog" or "all" collection
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-foreground)] mb-4">
          All Products
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Explore our complete collection of meticulously curated pet products designed for absolute comfort and joy.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)]">
          <h3 className="text-2xl font-bold mb-2 text-[var(--color-foreground)]">No products found</h3>
          <p className="text-slate-500">Please check your Shopify Storefront API connection or add products to your store.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => {
            const price = parseFloat(product.priceRange.minVariantPrice.amount);
            const formattedPrice = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: product.priceRange.minVariantPrice.currencyCode,
            }).format(price);

            return (
              <ProductCard
                key={product.handle}
                handle={product.handle}
                title={product.title}
                price={formattedPrice}
                imageUrl={product.images?.edges[0]?.node?.url || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800&auto=format&fit=crop'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
