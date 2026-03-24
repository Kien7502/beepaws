import { getProducts } from '@/lib/shopify/queries';
import ProductCard from '@/components/product/ProductCard';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const title = resolvedParams.handle.charAt(0).toUpperCase() + resolvedParams.handle.slice(1);
  return {
    title: `${title} | Beepaws`,
    description: `Shop our premium collection of ${resolvedParams.handle} products.`,
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const collectionHandle = resolvedParams.handle;
  const products = await getProducts({ collectionHandle });

  if (products.length === 0 && collectionHandle !== 'all') {
    // In a real app we might show an empty state, but for a pet shop if a collection 
    // doesn't have products or doesn't exist, we fallback or show a message.
  }

  const title = collectionHandle.charAt(0).toUpperCase() + collectionHandle.slice(1);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-foreground)] mb-4">
          {title} Collection
        </h1>
      </div>

      {products.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-32 px-4 bg-[var(--color-secondary)]/10 backdrop-blur-sm border-2 border-dashed border-[var(--color-primary)]/20 rounded-[3rem] text-center">
          <span className="text-6xl mb-6 opacity-80">🐾</span>
          <h3 className="text-3xl font-black mb-3 text-[var(--color-foreground)]">No products found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-lg">We couldn't find any products in the "{title}" collection.</p>
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
                imageUrl={product.images?.edges[0]?.node?.url || 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?q=80&w=800&auto=format&fit=crop'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
