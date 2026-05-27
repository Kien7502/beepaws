import { getFullProductForPage, getPaymentMethods, getProduct, getProducts } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import VariantSelector from "@/components/product/VariantSelector";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Truck, ShieldCheck, RefreshCcw, Check } from "lucide-react";
import { ProductDetailsSections } from "@/components/product/ProductDetailsSections";
import { FinalCTASection } from "@/components/product/FinalCTASection";
import { StickyAddToCart } from "@/components/product/StickyAddToCart";
import { ComparisonTable } from "@/components/product/ComparisonTable";
import { UseCaseCards } from "@/components/product/UseCaseCards";
import { FAQSection } from "@/components/product/FAQSection";
import { UGCReviews } from "@/components/product/UGCReviews";
import { BeforeAfterSlider } from "@/components/product/BeforeAfterSlider";
import { PainPoints } from "@/components/product/PainPoints";
import { Mechanism } from "@/components/product/Mechanism";
import { SilentReassurance } from "@/components/product/SilentReassurance";
import { GuaranteeBlock } from "@/components/product/GuaranteeBlock";
import { BundleBuyCard } from "@/components/product/BundleBuyCard";
import { WaveDivider } from "@/components/ui/WaveDivider";
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

  // Device-only sections (Mechanism + SilentReassurance) gate on the Shopify
  // product tag "device". The seed-product-metafields script auto-applies
  // this tag on each product run, so new device launches pick it up without
  // a manual Admin step. Consumables stay untagged → those sections skip.
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
            {/* Eyebrow pill — per device reference §PRODUCT HERO. Brand
                anchor before the headline. Phase 5 will let editors swap
                this via metafield. */}
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-honey-tint px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.07em] text-clay">
              Vet-grade technology · At home
            </span>

            <h1 className="font-display mt-3 text-balance text-[33px] font-bold leading-[1.1] tracking-tight text-cocoa md:text-[40px]">
              {product.title}
            </h1>

            {/* Rating row — pulled from beepaws.reviews aggregation when
                present. SocialProofBar replaced inline for tighter layout. */}
            {product.rating && (
              <div className="mt-3 flex items-center gap-2 text-sm text-brown">
                <span className="text-base tracking-widest text-gold">★★★★★</span>
                <span>
                  <span className="font-bold text-cocoa">{product.rating.avg.toFixed(1)}</span>
                  <span> · </span>
                  <span className="underline-offset-2 hover:underline">
                    {product.rating.count.toLocaleString()}+ pet parents
                  </span>
                </span>
              </div>
            )}

            {/* Price row — strikethrough + sale pill when compareAtPrice is set */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-[33px] font-bold text-ink">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: minVariantPrice.currencyCode,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(parseFloat(minVariantPrice.amount))}
              </span>
              {product.compareAtPriceRange?.minVariantPrice &&
                parseFloat(product.compareAtPriceRange.minVariantPrice.amount) >
                  parseFloat(minVariantPrice.amount) && (
                  <>
                    <span className="text-lg text-brown/60 line-through">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: product.compareAtPriceRange.minVariantPrice.currencyCode,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(parseFloat(product.compareAtPriceRange.minVariantPrice.amount))}
                    </span>
                    <span className="rounded-md bg-gold px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-cocoa">
                      Save{" "}
                      {Math.round(
                        ((parseFloat(product.compareAtPriceRange.minVariantPrice.amount) -
                          parseFloat(minVariantPrice.amount)) /
                          parseFloat(product.compareAtPriceRange.minVariantPrice.amount)) *
                          100,
                      )}
                      %
                    </span>
                  </>
                )}
              {!product.availableForSale && (
                <span className="rounded-full bg-cocoa/10 px-2.5 py-0.5 text-xs font-bold text-cocoa">
                  Out of stock
                </span>
              )}
            </div>

            {/* Vet-bill anchor — frames the price against the $500-$1,400+ vet
                quote per plan §"Anchoring rule". Always include the vet bill
                comparison, never undercut against cheaper competitor devices. */}
            <div className="mt-3 rounded-r-md border-l-[3px] border-gold bg-cream px-3 py-2.5 text-[13.5px] leading-snug text-brown">
              The same ultrasonic technology your vet uses in the operatory —
              the one they charge <b className="text-rose-soft">$500–$1,400+</b>{" "}
              to use. Now it lives in your hand.
            </div>

            {beepaws?.bullets && beepaws.bullets.length > 0 && (
              <ul className="mt-5 space-y-2.5">
                {beepaws.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-cocoa"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-clay"
                      strokeWidth={3}
                      aria-hidden
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Buy area — bundle tier picker + Add/Buy + payment row. The
                Add-to-cart button carries id="sticky-cta-trigger"; the
                StickyAddToCart bar reveals the moment that button's bottom
                edge scrolls past viewport top (scroll listener, matches the
                reference HTML's addBtn.getBoundingClientRect().bottom check). */}
            <div className="mt-6">
              <VariantSelector
                product={product}
                addonProducts={recommendedBundleProducts}
                paymentMethods={paymentMethods}
                educationNote={beepaws?.educationNote}
                bundleTiers={beepaws?.bundleTiers}
              />
            </div>

            {/* Mini-trust 3-up — matches device reference .mini-trust. Smaller,
                closer to the CTA than the previous full trust grid. */}
            <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
              <li className="flex flex-col items-center gap-1 text-center text-[11.5px] font-bold text-brown">
                <ShieldCheck className="h-5 w-5 text-clay" aria-hidden />
                <span>Silent — won&apos;t scare<br />skittish pets</span>
              </li>
              <li className="flex flex-col items-center gap-1 text-center text-[11.5px] font-bold text-brown">
                <Truck className="h-5 w-5 text-clay" aria-hidden />
                <span>Free shipping<br />over $50</span>
              </li>
              <li className="flex flex-col items-center gap-1 text-center text-[11.5px] font-bold text-brown">
                <RefreshCcw className="h-5 w-5 text-clay" aria-hidden />
                <span>30-day money-back<br />guarantee</span>
              </li>
            </ul>

            {/* Description/Specs accordion and "Questions? Contact us" link
                intentionally removed per device reference — pinfo ends at the
                mini-trust 3-up so the buy column stays focused on the decision.
                Description/specs data still lives on the product; surface it
                via metafields if it needs to render below the fold. */}
          </div>
        </div>
        </ProductMediaSync>
      </div>

      {/* ── Below-fold sections ─────────────────────────────────────────────────
          Section order (matches device reference): gallery+bundle → PainPoints
          → Mechanism → SilentReassurance → BeforeAfterSlider → ComparisonTable
          → UseCaseCards → UGCReviews → FAQSection → GuaranteeBlock → FBT →
          FinalCTASection.

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

      {isDevice ? (
        <>
          {/* cream → paper: into Mechanism (Reason + 3-step "how it works") */}
          <WaveDivider from="#FBF3E1" to="#FDF8EC" />
          <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
            <Mechanism steps={beepaws?.mechanismSteps} />
            {/* SilentReassurance shares the paper bg — they read as one arc. */}
            <SilentReassurance note={beepaws?.educationNote} />
          </div>
          {/* paper → cream: into BeforeAfterSlider */}
          <WaveDivider from="#FDF8EC" to="#FBF3E1" flip />
        </>
      ) : null}
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <BeforeAfterSlider slides={beepaws?.beforeAfterSlides} />
      </div>

      {/* cream → honey-tint: into ComparisonTable + UseCaseCards */}
      <WaveDivider from="#FBF3E1" to="#F6E6C6" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <ComparisonTable rows={beepaws?.comparisonRows} />
        {/* UseCaseCards also lives on honey-tint — no wave between, the two
            sections share the band visually. UseCaseCards isn't in the
            reference template; kept as a generic "who it's for" moment. */}
        <UseCaseCards cards={beepaws?.useCases} />
      </div>

      {/* honey-tint → paper: into testimonials (paper per reference) */}
      <WaveDivider from="#F6E6C6" to="#FDF8EC" flip />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <UGCReviews reviews={beepaws?.reviews} />
      </div>

      {/* paper → honey-tint: into FAQ (honey-tint per reference) */}
      <WaveDivider from="#FDF8EC" to="#F6E6C6" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <FAQSection items={beepaws?.faqItems} />
      </div>

      {/* honey-tint → cream: into Guarantee + product details + FBT */}
      <WaveDivider from="#F6E6C6" to="#FBF3E1" flip />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        {/* GuaranteeBlock, ProductDetailsSections, and the FBT cross-sell
            share the cream band so they continue seamlessly into the cocoa
            final-CTA below. */}
        <GuaranteeBlock guarantee={beepaws?.guarantee} />
        <div className="bg-cream">
          {fullProduct?.normalized && (
            <div className="container mx-auto max-w-7xl px-4 pb-12 md:px-6 md:pb-16">
              <ProductDetailsSections normalized={fullProduct.normalized} />
            </div>
          )}
          {recommendedBundleProducts.length > 0 && (
            <section className="pb-14 md:pb-20">
              <div className="container mx-auto max-w-3xl px-4 md:px-6">
                <div className="mb-8 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">
                    Frequently bought together
                  </p>
                  <h2 className="font-display mt-2 text-3xl font-bold text-cocoa md:text-[34px]">
                    Complete the routine
                  </h2>
                </div>
                <BundleBuyCard currentProduct={product} products={recommendedBundleProducts} />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* cream → cocoa: lean final CTA — one button, one price, one push. */}
      <WaveDivider from="#FBF3E1" to="#4A2E16" />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <FinalCTASection
          fromPrice={new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: minVariantPrice.currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(parseFloat(minVariantPrice.amount))}
        />
      </div>

      <StickyAddToCart product={product} />
    </div>
  );
}
