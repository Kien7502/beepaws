import { getFullProductForPage, getProduct, getProducts } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import VariantSelector from "@/components/product/VariantSelector";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Truck, ShieldCheck, RefreshCcw, Package } from "lucide-react";
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
    // overflowX:"clip" not overflow-clip — avoids hard vertical paint boundary that causes 1px compositor seam at sub-100% zoom
    <div className="relative" style={{ overflowX: "clip" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative container mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-[7.5rem]">
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
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-green-icon)]"
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
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-green-icon)]"
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
                  className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-green-icon)]"
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

      {/* ── Below-fold sections ─────────────────────────────────────────────────
          Each WaveDivider carries the bg of the section ABOVE (from=) and BELOW (to=).
          marginTop:"-3px" + zIndex:1 on every wrapper ensures the section physically
          overlaps the wave bottom edge, hiding any subpixel compositor gap. ──────── */}

      {/* cream → gold stats bar */}
      <WaveDivider from="#fff5e4" to="#f5a800" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <StatsTrustBar />
      </div>

      {/* gold → cream comparison */}
      <WaveDivider from="#f5a800" to="#fff5e4" flip />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <ComparisonTable />
      </div>

      {/* cream → amber use cases */}
      <WaveDivider from="#fff5e4" to="#FFE8B0" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <UseCaseCards />
      </div>

      {/* amber → brown testimonials (#7A4A1E = same as Buy now button --color-accent) */}
      <WaveDivider from="#FFE8B0" to="#7A4A1E" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <UGCReviews />
      </div>

      {/* brown → cream FAQ */}
      <WaveDivider from="#7A4A1E" to="#FFF5E4" flip />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <FAQSection />
        {/* bg must match FAQSection so ProductDetailsSections continues seamlessly */}
        <div className="bg-[#FFF5E4]">
          {fullProduct?.normalized && (
            <div className="container mx-auto max-w-7xl px-4 pb-12 md:px-6 md:pb-16">
              <ProductDetailsSections normalized={fullProduct.normalized} />
            </div>
          )}
        </div>
      </div>

      <StickyAddToCart product={product} />
    </div>
  );
}
