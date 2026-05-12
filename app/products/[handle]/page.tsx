import { getFullProductForPage, getProduct, getProducts } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import VariantSelector from "@/components/product/VariantSelector";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Truck, ShieldCheck, RefreshCcw, Package } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import Link from "next/link";
import { ProductDetailsSections } from "@/components/product/ProductDetailsSections";
import { BundleBuyCard } from "@/components/product/BundleBuyCard";
import { SocialProofBar } from "@/components/product/SocialProofBar";
import { StickyAddToCart } from "@/components/product/StickyAddToCart";
import { StatsTrustBar } from "@/components/product/StatsTrustBar";
import { ComparisonTable } from "@/components/product/ComparisonTable";
import { UseCaseCards } from "@/components/product/UseCaseCards";
import { FAQSection } from "@/components/product/FAQSection";
import { UGCReviews } from "@/components/product/UGCReviews";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { DescriptionAccordion } from "@/components/product/DescriptionAccordion";
import { extractImagesFromProductHtml } from "@/lib/shopify/extract-description-images";
import { parseDescriptionSections } from "@/lib/shopify/parse-description-sections";

// ISR: revalidate via webhook → revalidateTag("products")
// Fallback: re-generate every 1 hour even without a webhook push
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: "Not found | Beepaws" };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/products/${handle}`;
  const title = `${product.seo?.title || product.title} | Beepaws`;
  const description = (product.seo?.description || product.description || "").slice(0, 160);
  const ogImage = product.images.edges[0]?.node?.url;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      siteName: "Beepaws",
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 1200, alt: product.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resolvedParams = await params;
  const fullProduct = await getFullProductForPage(resolvedParams.handle);
  const product = await getProduct(resolvedParams.handle);

  if (!product) return notFound();

  const fallbackUrl = "/product-placeholder.svg";
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const hasPriceRange =
    minVariantPrice.amount !== maxVariantPrice.amount &&
    product.variants.edges.length > 1;

  const plain = product.description?.trim() ?? "";
  const html =
    product.descriptionHtml?.trim() || (plain ? `<p>${plain}</p>` : "");

  const { strippedHtml } = extractImagesFromProductHtml(html);
  const allSections = parseDescriptionSections(strippedHtml);
  const introSection = allSections.find((s) => s.heading === null);
  const accordionSections = allSections.filter((s) => s.heading !== null);

  const introHtml = introSection?.html ?? null;

  const primaryCollectionHandle = fullProduct?.collections?.edges?.[0]?.node?.handle;
  const collectionRecommendations = primaryCollectionHandle
    ? (await getProducts({ collectionHandle: primaryCollectionHandle }))
        .filter((p) => p.handle !== product.handle)
        .slice(0, 3)
    : [];
  const recommendedBundleProducts =
    collectionRecommendations.length > 0
      ? collectionRecommendations
      : (await getProducts())
          .filter((p) => p.handle !== product.handle)
          .slice(0, 3);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.edges.map((e) => e.node.url),
    url: `${siteUrl}/products/${product.handle}`,
    brand: { "@type": "Brand", name: "Beepaws" },
    offers: {
      "@type": "Offer",
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      price: product.priceRange.minVariantPrice.amount,
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Beepaws" },
    },
  };

  return (
    <div className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(147,51,234,0.12),transparent)]"
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
            <div className="lg:sticky lg:top-24">
              <ProductGallery
                productTitle={product.title}
                images={product.images.edges}
                fallbackUrl={fallbackUrl}
              />
            </div>
          </div>

          <div className="flex flex-col lg:col-span-5 lg:pb-16" style={{ overflowAnchor: "none" }}>
            <SocialProofBar />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  product.availableForSale
                    ? "bg-emerald-600/15 text-emerald-800"
                    : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                }`}
              >
                <Package className="h-3.5 w-3.5" aria-hidden />
                {product.availableForSale ? "In stock" : "Unavailable"}
              </span>
              {hasPriceRange && (
                <span className="text-xs font-semibold text-[var(--color-accent)]/70">
                  Price varies by option
                </span>
              )}
            </div>

            <h1 className="text-balance text-3xl font-extrabold leading-[1.15] tracking-tight text-[var(--color-foreground)] md:text-4xl xl:text-[2.5rem]">
              {product.title}
            </h1>

            {introHtml && (
              <p className="mt-4 text-base leading-relaxed text-[var(--color-accent)]/75">
                {introHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
              </p>
            )}

            <div className="mt-8 border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--elev-shadow-card)] md:p-8">
              <VariantSelector product={product} />
            </div>
            <div id="sticky-cta-sentinel" />

            {recommendedBundleProducts.length > 0 && (
              <div className="mt-6 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--elev-shadow-card)] md:p-6">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--color-accent)]/70">
                  Frequently bought together
                </p>
                <BundleBuyCard
                  currentProduct={product}
                  products={recommendedBundleProducts}
                />
              </div>
            )}

            <DescriptionAccordion sections={accordionSections} />

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              <li className="flex gap-3 border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                <Truck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    Free shipping
                  </p>
                  <p className="text-xs text-[var(--color-accent)]/70">
                    Orders over $50
                  </p>
                </div>
              </li>
              <li className="flex gap-3 border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                <RefreshCcw
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    30-day returns
                  </p>
                  <p className="text-xs text-[var(--color-accent)]/70">
                    Simple &amp; fair
                  </p>
                </div>
              </li>
              <li className="flex gap-3 border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-bold text-[var(--color-foreground)]">
                    Secure checkout
                  </p>
                  <p className="text-xs text-[var(--color-accent)]/70">
                    Encrypted payment
                  </p>
                </div>
              </li>
            </ul>

            <p className="mt-8 text-center text-sm text-[var(--color-accent)]/70 sm:text-left">
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
      </div>

      <WaveDivider from="#fffaf2" to="#f5a800" />
      <StatsTrustBar />
      <WaveDivider from="#f5a800" to="#fffaf2" flip />
      <ComparisonTable />
      <WaveDivider from="#fffaf2" to="#fff3dc" />
      <UseCaseCards />
      <WaveDivider from="#fff3dc" to="#8b5e2a" />
      <UGCReviews />
      <WaveDivider from="#8b5e2a" to="#fffaf2" flip />
      <FAQSection />

      <div className="container mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
        {fullProduct?.normalized ? (
          <ProductDetailsSections normalized={fullProduct.normalized} />
        ) : null}
      </div>

      <StickyAddToCart product={product} />
    </div>
  );
}
