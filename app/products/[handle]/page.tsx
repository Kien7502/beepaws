import { getProduct } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import VariantSelector from "@/components/product/VariantSelector";
import { Truck, ShieldCheck, RefreshCcw } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.handle);
  if (!product) return { title: "Not found | Beepaws" };

  return {
    title: `${product.seo.title || product.title} | Beepaws`,
    description: product.seo.description || product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.handle);

  if (!product) return notFound();

  const imageUrl =
    product.images?.edges[0]?.node?.url ||
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/collections/all" },
          { label: product.title },
        ]}
      />

      <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
        <div className="w-full md:w-1/2">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-4 md:sticky md:top-28">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--background)]">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images.edges.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {product.images.edges.map(({ node }, index) => (
                  <button
                    key={node.url}
                    type="button"
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      index === 0
                        ? "border-[var(--color-primary)]"
                        : "border-transparent hover:border-[var(--color-border)]"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img
                      src={node.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col pt-2 md:pt-0">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[var(--color-foreground)] mb-4 leading-tight">
            {product.title}
          </h1>

          <div className="mt-4 mb-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-sm">
            <VariantSelector product={product} />
          </div>

          <div className="mb-8">
            <h2 className="font-bold text-lg mb-3 text-[var(--color-foreground)]">
              Description
            </h2>
            <div
              className="max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-base [&_p]:mb-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
              dangerouslySetInnerHTML={{
                __html: product.descriptionHtml || `<p>${product.description}</p>`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--color-border)] pt-8 mt-auto">
            <div className="flex flex-col items-center text-center p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
              <Truck className="text-[var(--color-accent)] mb-2" size={24} />
              <span className="text-sm font-bold text-[var(--color-foreground)]">
                Free shipping
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                On orders over $50
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
              <RefreshCcw className="text-[var(--color-accent)] mb-2" size={24} />
              <span className="text-sm font-bold text-[var(--color-foreground)]">
                30-day returns
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Hassle-free guarantee
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
              <ShieldCheck className="text-[var(--color-accent)] mb-2" size={24} />
              <span className="text-sm font-bold text-[var(--color-foreground)]">
                Secure checkout
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                256-bit encryption
              </span>
            </div>
          </div>

          <p className="mt-8 text-center sm:text-left text-sm text-slate-500 dark:text-slate-400">
            Need help?{" "}
            <Link
              href="/contact"
              className="font-semibold text-[var(--color-primary)] hover:underline"
            >
              Contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
