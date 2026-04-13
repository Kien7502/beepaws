import { getProduct } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import VariantSelector from "@/components/product/VariantSelector";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Truck, ShieldCheck, RefreshCcw } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

  const fallbackUrl = "/product-placeholder.svg";

  return (
    <div className="container mx-auto px-4 md:px-6 section-y max-w-7xl">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/collections/all" },
          { label: product.title },
        ]}
      />

      <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
        <div className="w-full md:w-1/2">
          <ProductGallery
            productTitle={product.title}
            images={product.images.edges}
            fallbackUrl={fallbackUrl}
          />
        </div>

        <div className="w-full md:w-1/2 flex flex-col pt-2 md:pt-0">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[var(--color-foreground)] mb-4 leading-tight tracking-tight">
            {product.title}
          </h1>

          <div className="mt-4 mb-8 card-elevated p-6 md:transition-shadow md:hover:shadow-elevated">
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
            <div className="flex flex-col items-center text-center p-4 card-elevated rounded-2xl">
              <Truck className="text-[var(--color-accent)] mb-2" size={24} />
              <span className="text-sm font-bold text-[var(--color-foreground)]">
                Free shipping
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                On orders over $50
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 card-elevated rounded-2xl">
              <RefreshCcw className="text-[var(--color-accent)] mb-2" size={24} />
              <span className="text-sm font-bold text-[var(--color-foreground)]">
                30-day returns
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Hassle-free guarantee
              </span>
            </div>
            <div className="flex flex-col items-center text-center p-4 card-elevated rounded-2xl">
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
