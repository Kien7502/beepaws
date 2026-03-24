import { getProduct } from '@/lib/shopify/queries';
import { notFound } from 'next/navigation';
import VariantSelector from '@/components/product/VariantSelector';
import { Truck, ShieldCheck, RefreshCcw } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.handle);
  if (!product) return { title: 'Not Found' };
  
  return {
    title: `${product.seo.title || product.title} | Beepaws`,
    description: product.seo.description || product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.handle);

  if (!product) return notFound();

  // Basic image or fallback to cute corgi
  const imageUrl = product.images?.edges[0]?.node?.url || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop';

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
        
        {/* Left: Product Images */}
        <div className="w-full md:w-1/2">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-4 sticky top-24">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--background)]">
              {/* Note: using img for mock rendering. Real shopify project should use next/image with configured domains. */}
              <img 
                src={imageUrl} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Gallery Thumbnails */}
            {product.images.edges.length > 1 && (
              <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                {product.images.edges.map(({node}, index) => (
                  <button key={node.url} className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 ${index === 0 ? 'border-[var(--color-primary)]' : 'border-transparent'}`}>
                    <img src={node.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Details & Actions */}
        <div className="w-full md:w-1/2 flex flex-col pt-4">
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[var(--color-foreground)] mb-4 leading-tight">
            {product.title}
          </h1>

          {/* Variant Selector handles price rendering and interaction */}
          <div className="mt-6 mb-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-sm">
            <VariantSelector product={product} />
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-lg mb-3 text-[var(--color-foreground)]">Description</h3>
            <div
              className="max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-base [&_p]:mb-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml || `<p>${product.description}</p>` }}
            />
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--color-border)] pt-8 mt-auto">
            <div className="flex flex-col items-center text-center p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
              <Truck className="text-[var(--color-accent)] mb-2" size={24} />
              <span className="text-sm font-bold text-[var(--color-foreground)]">Free Shipping</span>
              <span className="text-xs text-slate-500">On orders over $50</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
              <RefreshCcw className="text-[var(--color-accent)] mb-2" size={24} />
              <span className="text-sm font-bold text-[var(--color-foreground)]">30-Day Returns</span>
              <span className="text-xs text-slate-500">Hassle-free guarantee</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
              <ShieldCheck className="text-[var(--color-accent)] mb-2" size={24} />
              <span className="text-sm font-bold text-[var(--color-foreground)]">Secure Checkout</span>
              <span className="text-xs text-slate-500">256-bit encryption</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
