import { getProduct } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import VariantSelector from "@/components/product/VariantSelector";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Truck, ShieldCheck, RefreshCcw, Package } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import Link from "next/link";
import { ProductAboutSection } from "@/components/product/ProductAboutSection";

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
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const hasPriceRange =
    minVariantPrice.amount !== maxVariantPrice.amount &&
    product.variants.edges.length > 1;

  const plain = product.description?.trim() ?? "";
  const subtitle =
    plain.length > 180 ? `${plain.slice(0, 178).trim()}…` : plain || null;

  const html =
    product.descriptionHtml?.trim() || (plain ? `<p>${plain}</p>` : "");

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(147,51,234,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(147,51,234,0.18),transparent)]"
        aria-hidden
      />

      <div className="relative container mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pb-24 md:pt-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/collections/all" },
            { label: product.title },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-7">
            <ProductGallery
              productTitle={product.title}
              images={product.images.edges}
              fallbackUrl={fallbackUrl}
            />
          </div>

          <div className="flex flex-col lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  product.availableForSale
                    ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                    : "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Package className="h-3.5 w-3.5" aria-hidden />
                {product.availableForSale ? "In stock" : "Unavailable"}
              </span>
              {hasPriceRange && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Price varies by option
                </span>
              )}
            </div>

            <h1 className="text-balance text-3xl font-extrabold leading-[1.15] tracking-tight text-[var(--color-foreground)] md:text-4xl xl:text-[2.5rem]">
              {product.title}
            </h1>

            {subtitle && (
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                {subtitle}
              </p>
            )}

            <div className="mt-8 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--elev-shadow-card)] md:p-8">
              <VariantSelector product={product} showPriceRangeHint={hasPriceRange} />
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              <li className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                <Truck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    Free shipping
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Orders over $50
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                <RefreshCcw
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    30-day returns
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Simple &amp; fair
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 sm:col-span-1">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    Secure checkout
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Encrypted payment
                  </p>
                </div>
              </li>
            </ul>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 sm:text-left">
              Questions?{" "}
              <Link
                href="/contact"
                className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                Contact us
              </Link>
            </p>
          </div>
        </div>

        <ProductAboutSection html={html} />
      </div>
    </div>
  );
}
