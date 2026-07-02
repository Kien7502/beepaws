import { getBundleContents } from "@/lib/shopify/bundle-contents";
import { getFullProductForPage, getPaymentMethods, getProduct, getProducts } from "@/lib/shopify/queries";
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
import { BundleBuyCard } from "@/components/product/BundleBuyCard";
import { BundleContents } from "@/components/product/BundleContents";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { ProductMediaSync } from "@/components/product/ProductMediaSync";
import { DynamicHeroPrice } from "@/components/product/DynamicHeroPrice";

type FullProduct = Awaited<ReturnType<typeof getFullProductForPage>>;
type Product = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
type PaymentMethods = Awaited<ReturnType<typeof getPaymentMethods>>;

// The full PDP render, shared by the live product page and the admin draft
// preview route (app/preview/products/[handle]). Async: it resolves the
// beepaws-dependent data (bundle items, tier bundles, recommendations) itself so
// the preview route can pass a fullProduct whose normalized.beepaws is the admin
// draft and have those follow-on fetches use the draft.
export async function ProductPageView({
  product,
  fullProduct,
  paymentMethods,
  handle,
}: {
  product: Product;
  fullProduct: FullProduct;
  paymentMethods: PaymentMethods;
  handle: string;
}) {
  const fallbackUrl = "/product-placeholder.svg";
  const { minVariantPrice } = product.priceRange;

  const beepaws = fullProduct?.normalized?.beepaws;

  // Section-level intro copy (single-entry list metafields). We read [0] and
  // coerce empty strings → undefined so partially-filled entries fall back to
  // each component's in-code default per-field. The mechanism paradox is two
  // flat metafield strings reconstructed into the component's paragraphs[].
  const ppi = beepaws?.painPointsIntro?.[0];
  const mi = beepaws?.mechanismIntro?.[0];
  const uci = beepaws?.useCasesIntro?.[0];
  const ci = beepaws?.comparisonIntro?.[0];
  const fi = beepaws?.faqIntro?.[0];
  const ri = beepaws?.reviewsIntro?.[0];
  const bai = beepaws?.beforeAfterIntro?.[0];
  const fcc = beepaws?.finalCtaCopy?.[0];
  const blank = (s?: string) => (s && s.trim() ? s : undefined);
  const mechParagraphs = [mi?.paradoxParagraph1, mi?.paradoxParagraph2].filter(
    (p): p is string => Boolean(p && p.trim()),
  );

  // Device-only sections (Mechanism + SilentReassurance) gate on the Shopify
  // product tag "device". The seed-product-metafields script auto-applies
  // this tag on each product run, so new device launches pick it up without
  // a manual Admin step. Consumables stay untagged → those sections skip.
  const isDevice = product.tags?.includes("device") ?? false;

  // Bundle products (Shopify Bundles / productBundleCreate) are tagged `bundle`
  // and carry component variants. Fetch the "what's included" list only for
  // bundles so normal products skip the extra query. See docs/bundles-from-admin.md.
  const isBundle = product.tags?.includes("bundle") ?? false;
  const bundleItems = isBundle ? await getBundleContents(handle) : [];

  // Resolve any bundle linked from a tier (beepaws.bundle_tiers[i].bundle) to its
  // cart-ready variant + price/image, aligned by tier index, so the tier picker
  // can "add the bundle" (one line; Shopify expands it) instead of separate items.
  // null when no link or the bundle is unpublished (getProduct returns nothing).
  const tierBundles = beepaws?.bundleTiers
    ? await Promise.all(
        beepaws.bundleTiers.map(async (t) => {
          const bundleHandle = t?.bundle?.handle;
          if (!bundleHandle) return null;
          // A customer-choose bundle is a normal multi-variant product, so carry
          // ALL its variants (to pick inline) + its components (to show what's
          // inside). null if no link or the bundle is unpublished.
          const [bp, components] = await Promise.all([
            getProduct(bundleHandle),
            getBundleContents(bundleHandle),
          ]);
          const vs = bp?.variants.edges.map((e) => e.node) ?? [];
          if (!bp || vs.length === 0) return null;
          return {
            handle: bp.handle,
            title: bp.title,
            currencyCode: vs[0].price.currencyCode,
            imageUrl: bp.images.edges[0]?.node?.url ?? "/product-placeholder.svg",
            components,
            variants: vs.map((v) => ({
              id: v.id,
              priceAmount: v.price.amount,
              availableForSale: v.availableForSale,
              selectedOptions: v.selectedOptions,
            })),
          };
        }),
      )
    : null;

  const primaryCollectionHandle = fullProduct?.collections?.edges?.[0]?.node?.handle;
  const collectionRecommendations = primaryCollectionHandle
    ? (await getProducts({ collectionHandle: primaryCollectionHandle }))
        .filter((p) => p.handle !== product.handle)
        .slice(0, 3)
    : [];
  const recommendedBundleProducts =
    collectionRecommendations.length > 0
      ? collectionRecommendations
      : (await getProducts()).filter((p) => p.handle !== product.handle).slice(0, 3);

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

      {/* Hero band — bg-paper to match the Header navbar (per user feedback
          the bg-card white was too cold). Page base is also paper, so this
          reads as the same continuous tone above and below the Header. */}
      <div className="bg-paper">
      <div className="relative container mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-10">
        {/* ProductMediaSync provides shared activeImage state between the
            gallery (left col) and the variant selector (right col), so picking
            a variant scrolls the gallery to the matching image. */}
        <ProductMediaSync imageUrls={product.images.edges.map((e) => e.node.url)}>
        <div className="grid gap-10 lg:grid-cols-[11fr_9fr] lg:gap-12 xl:gap-16">
          <div>
            <div className="lg:sticky lg:top-[7.5rem]">
              <ProductGallery
                productTitle={product.title}
                images={product.images.edges}
                fallbackUrl={fallbackUrl}
              />
            </div>
          </div>

          <div className="flex flex-col lg:pb-16" style={{ overflowAnchor: "none" }}>
            {/* Eyebrow pill — per device reference §PRODUCT HERO. Brand
                anchor before the headline. Phase 5 will let editors swap
                this via metafield. */}
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-honey-tint px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.07em] text-clay">
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

            {/* Price row — strikethrough + sale pill + out-of-stock pill.
                Lives inside ProductMediaSync; re-renders when VariantSelector
                publishes the picked variant so the displayed price follows
                color/accessory selection (just like the bundle picker total). */}
            <DynamicHeroPrice
              fallbackAmount={minVariantPrice.amount}
              currencyCode={minVariantPrice.currencyCode}
              compareAtAmount={product.compareAtPriceRange?.minVariantPrice?.amount ?? null}
              fallbackAvailable={product.availableForSale}
            />

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
                tierBundles={tierBundles}
              />
            </div>

            {/* What's included — bundle products only (renders null otherwise) */}
            <BundleContents items={bundleItems} />

            {/* Frequently Bought Together — moved into the hero under the buy
                card per restructure plan §Task 2 (was a standalone section
                between FAQ and Final CTA). Sits at the decision moment so the
                cross-sell happens while the cart intent is still warm.
                id="fbt" + scrollMarginTop are the scroll target for the Final
                CTA's "Shop the bundle" button. scrollMarginTop matches the
                gallery's sticky offset so the scrolled-to FBT clears the
                sticky header. */}
            {recommendedBundleProducts.length > 0 && (
              <div id="fbt" style={{ scrollMarginTop: "7.5rem" }}>
                <BundleBuyCard
                  currentProduct={product}
                  products={recommendedBundleProducts}
                />
              </div>
            )}

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
      </div>

      {/* ── Below-fold sections ─────────────────────────────────────────────────
          Per web-rec Step 2 — section bg sequence: white, sand, toffee, white,
          sand, white, sand, sand, bark, moss. Adjacent sections never share
          the same hue except FAQ → ProductDetailsSections (intentional — they
          read as one "more info" block). ───────────────────────────────────── */}

      {/* Hero (card) → PainPoints (card) — same bg, hairline border for the seam. */}
      <div className="border-t border-line">
        <PainPoints
          points={beepaws?.painPoints}
          eyebrow={blank(ppi?.eyebrow)}
          heading={blank(ppi?.heading)}
          lead={blank(ppi?.lead)}
        />
      </div>

      {/* PainPoints → UseCaseCards — direct, hairline border. */}
      <div className="border-t border-line">
        <UseCaseCards
          cards={beepaws?.useCases}
          eyebrow={blank(uci?.eyebrow)}
          heading={blank(uci?.heading)}
          lead={blank(uci?.lead)}
        />
      </div>

      {isDevice ? (
        <>
          {/* WAVE — sand → toffee: into Mechanism (Reason + 3-step + feels-
              broken cocoa-inset callout, merged in per restructure §Task 1). */}
          <WaveDivider from="#F2E7CC" to="#E5C58C" />
          <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
            <Mechanism
              steps={beepaws?.mechanismSteps}
              feelsBrokenNote={beepaws?.educationNote}
              introEyebrow={blank(mi?.introEyebrow)}
              introHeading={blank(mi?.introHeading)}
              introLead={blank(mi?.introLead)}
              paradoxHeading={blank(mi?.paradoxHeading)}
              paradoxParagraphs={mechParagraphs.length > 0 ? mechParagraphs : undefined}
              paradoxPullQuote={blank(mi?.paradoxPullQuote)}
              stepsHeading={blank(mi?.stepsHeading)}
              stepsLead={blank(mi?.stepsLead)}
              feelsBrokenHeading={blank(mi?.feelsBrokenHeading)}
            />
          </div>
          {/* WAVE — toffee → card: into BeforeAfterSlider */}
          <WaveDivider from="#E5C58C" to="#FFFFFF" flip />
          <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
            <BeforeAfterSlider
              slides={beepaws?.beforeAfterSlides}
              eyebrow={blank(bai?.eyebrow)}
              heading={blank(bai?.heading)}
              lead={blank(bai?.lead)}
            />
          </div>
        </>
      ) : (
        /* Non-device: skip Mechanism + its waves. UseCaseCards meets
           BeforeAfterSlider directly — hairline border separates. */
        <div className="border-t border-line">
          <BeforeAfterSlider
            slides={beepaws?.beforeAfterSlides}
            eyebrow={blank(bai?.eyebrow)}
            heading={blank(bai?.heading)}
            lead={blank(bai?.lead)}
          />
        </div>
      )}

      {/* BeforeAfterSlider → UGCReviews — direct, hairline border. */}
      <div className="border-t border-line">
        <UGCReviews
          reviews={beepaws?.reviews}
          eyebrow={blank(ri?.eyebrow)}
          heading={blank(ri?.heading)}
          lead={blank(ri?.lead)}
        />
      </div>

      {/* UGCReviews → ComparisonTable — direct, hairline border. */}
      <div className="border-t border-line">
        <ComparisonTable
          rows={beepaws?.comparisonRows}
          eyebrow={blank(ci?.eyebrow)}
          heading={blank(ci?.heading)}
          lead={blank(ci?.lead)}
        />
      </div>

      {/* WAVE — card → sand: into FAQ. The proof→close break. */}
      <WaveDivider from="#FFFFFF" to="#F2E7CC" flip />
      <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
        <FAQSection
          items={beepaws?.faqItems}
          eyebrow={blank(fi?.eyebrow)}
          heading={blank(fi?.heading)}
        />
      </div>

      {/* FAQ → ProductDetailsSections — component is self-contained (owns its
          bg-sand, container, and border-t). Returns null when the product has
          no usage_guide / qna / bundle_buy metafields, so no empty band
          renders for products that don't have this content. */}
      {fullProduct?.normalized && (
        <ProductDetailsSections normalized={fullProduct.normalized} />
      )}

      {/* → FinalCTA (bark): direct meeting. Hairline border at the seam —
          the bg jump from sand → bark already reads strongly. */}
      <div className="border-t border-line" style={{ position: "relative", zIndex: 1 }}>
        <FinalCTASection
          fromPrice={new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: minVariantPrice.currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(parseFloat(minVariantPrice.amount))}
          heading={blank(fcc?.heading)}
          body={blank(fcc?.body)}
          smallPrint={blank(fcc?.smallPrint)}
          guarantee={beepaws?.guarantee}
        />
      </div>

      <StickyAddToCart product={product} />
    </div>
  );
}
