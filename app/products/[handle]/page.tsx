import { getFullProductForPage, getPaymentMethods, getProduct, getProducts } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import VariantSelector from "@/components/product/VariantSelector";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Truck, ShieldCheck, RefreshCcw, Package, Check } from "lucide-react";
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
import { BeforeAfterSlider } from "@/components/product/BeforeAfterSlider";
import { PainPoints } from "@/components/product/PainPoints";
import { Mechanism } from "@/components/product/Mechanism";
import { SilentReassurance } from "@/components/product/SilentReassurance";
import { GuaranteeBlock } from "@/components/product/GuaranteeBlock";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { DescriptionAccordion } from "@/components/product/DescriptionAccordion";
import { ProductMediaSync } from "@/components/product/ProductMediaSync";

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
  // Parallel fetch — payment methods are shop-wide so they don't need the
  // product to resolve. Single round-trip latency instead of stacked.
  const [fullProduct, product, paymentMethods] = await Promise.all([
    getFullProductForPage(resolvedParams.handle),
    getProduct(resolvedParams.handle),
    getPaymentMethods(),
  ]);

  if (!product) return notFound();

  const fallbackUrl = "/product-placeholder.svg";
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const hasPriceRange =
    minVariantPrice.amount !== maxVariantPrice.amount &&
    product.variants.edges.length > 1;

  const descriptionBodyHtml = product.descriptionHtml?.trim() || null;

  const beepaws = fullProduct?.normalized?.beepaws;

  // Gate device-only sections (Mechanism, SilentReassurance) on Shopify tag.
  // Add tag "device" to dental scaler / hardware products; consumables and
  // accessories skip those sections automatically.
  const isDevice = product.tags?.includes("device") ?? false;

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
        {/* ProductMediaSync provides shared activeImage state between the
            gallery (left col) and the variant selector (right col), so picking
            a variant scrolls the gallery to the matching image. */}
        <ProductMediaSync imageUrls={product.images.edges.map((e) => e.node.url)}>
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

            {beepaws?.bullets && beepaws.bullets.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {beepaws.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-[var(--color-foreground)]"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-green-icon)]"
                      strokeWidth={3}
                      aria-hidden
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--elev-shadow-card)] md:p-8">
              <VariantSelector
                product={product}
                addonProducts={recommendedBundleProducts}
                paymentMethods={paymentMethods}
                educationNote={beepaws?.educationNote}
                bundleTiers={beepaws?.bundleTiers}
              />
            </div>
            {/* IntersectionObserver target — StickyAddToCart shows once this scrolls past viewport top */}
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

            <DescriptionAccordion
              descriptionHtml={descriptionBodyHtml}
              techSpecs={beepaws?.techSpecs}
              ingredients={beepaws?.ingredients}
            />

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
        </ProductMediaSync>
      </div>

      {/* ── Below-fold sections ─────────────────────────────────────────────────
          Plan §Phase 4 order: gallery+bundle → PainPoints → StatsTrustBar →
          Mechanism → SilentReassurance → BeforeAfterSlider → ComparisonTable →
          UseCaseCards → UGCReviews → FAQSection → GuaranteeBlock.

          Mechanism + SilentReassurance are device-only; they render only when
          the Shopify product carries the "device" tag. The wave sequence
          adapts to whichever path renders. WaveDivider takes hex literals —
          SVG fill doesn't process var() — so we hand-maintain these against
          globals.css. ──────────────────────────────────────────────────── */}

      {/* paper → cream: into PainPoints */}
      <WaveDivider from="#FDF8EC" to="#FBF3E1" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <PainPoints points={beepaws?.painPoints} />
      </div>

      {/* cream → cocoa: into the trust-stats strip */}
      <WaveDivider from="#FBF3E1" to="#4A2E16" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <StatsTrustBar stats={beepaws?.stats} />
      </div>

      {isDevice ? (
        <>
          {/* cocoa → paper: into Mechanism (device-only) */}
          <WaveDivider from="#4A2E16" to="#FDF8EC" flip />
          <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
            <Mechanism steps={beepaws?.mechanismSteps} />
            {/* SilentReassurance sits flush against Mechanism (same paper bg,
                no wave between) so they read as one "how it actually works"
                arc per the reference. */}
            <SilentReassurance note={beepaws?.educationNote} />
          </div>

          {/* paper → cream: into BeforeAfterSlider */}
          <WaveDivider from="#FDF8EC" to="#FBF3E1" />
        </>
      ) : (
        <>
          {/* Non-device path: skip Mechanism / SilentReassurance, go straight
              from the stats strip into the before/after proof. */}
          <WaveDivider from="#4A2E16" to="#FBF3E1" flip />
        </>
      )}
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <BeforeAfterSlider slides={beepaws?.beforeAfterSlides} />
      </div>

      {/* cream → honey-tint: into ComparisonTable */}
      <WaveDivider from="#FBF3E1" to="#F6E6C6" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <ComparisonTable rows={beepaws?.comparisonRows} />
        {/* UseCaseCards also lives on honey-tint — no wave between, the two
            sections share the band visually. */}
        <UseCaseCards cards={beepaws?.useCases} />
      </div>

      {/* honey-tint → cocoa: into testimonials */}
      <WaveDivider from="#F6E6C6" to="#4A2E16" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <UGCReviews reviews={beepaws?.reviews} />
      </div>

      {/* cocoa → cream: into FAQ + GuaranteeBlock + product details */}
      <WaveDivider from="#4A2E16" to="#FBF3E1" flip />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <FAQSection items={beepaws?.faqItems} />
        {/* GuaranteeBlock and ProductDetailsSections share the cream band so
            they continue seamlessly. */}
        <GuaranteeBlock guarantee={beepaws?.guarantee} />
        <div className="bg-cream">
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
