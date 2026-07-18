import { getBundleContents } from "@/lib/shopify/bundle-contents";
import { getSellingPlans } from "@/lib/shopify/selling-plans";
import { isSellableOnStorefront } from "@/lib/shopify/storefront-visibility";
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
import { IngredientsSection } from "@/components/product/IngredientsSection";
import ProductCard from "@/components/product/ProductCard";
import { BundleContents } from "@/components/product/BundleContents";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { ProductMediaSync } from "@/components/product/ProductMediaSync";
import { DynamicHeroPrice } from "@/components/product/DynamicHeroPrice";
import RevealObserver from "@/components/RevealObserver";

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
  const ii = beepaws?.ingredientsIntro?.[0];
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

  // Product-type tags decide the Mechanism-slot section: `device` → Mechanism,
  // `consumable` → "What's inside" (ingredients). Explicit opt-in per type —
  // an untagged product gets neither — so future product types never inherit
  // a section by accident. Both sections render lorem defaults until authored
  // (the codebase convention: unedited reads as unedited).
  const isConsumable = product.tags?.includes("consumable") ?? false;

  // Subscribe & Save (handoff §1): selling plans from the official Shopify
  // Subscriptions app, read via the Storefront API. Empty when the product
  // has none or the storefront token isn't configured — the buy column then
  // renders exactly as before.
  const sellingPlans = isBundle ? [] : await getSellingPlans(handle);

  // Resolve any bundle linked from a tier (beepaws.bundle_tiers[i].bundle) to its
  // cart-ready variant + price/image, aligned by tier index, so the tier picker
  // can "add the bundle" (one line; Shopify expands it) instead of separate items.
  // null when no link OR the storefront channel can't sell the bundle. The
  // Admin API behind getProduct returns ARCHIVED/unpublished products too, and
  // offering those makes the Storefront Cart API create GHOST lines (invisible
  // in cart.lines, still charged in subtotal) — hence isSellableOnStorefront.
  const tierBundles = beepaws?.bundleTiers
    ? await Promise.all(
        beepaws.bundleTiers.map(async (t) => {
          const bundleHandle = t?.bundle?.handle;
          if (!bundleHandle) return null;
          // A customer-choose bundle is a normal multi-variant product, so carry
          // ALL its variants (to pick inline) + its components (to show what's
          // inside).
          const [bp, components, sellable] = await Promise.all([
            getProduct(bundleHandle),
            getBundleContents(bundleHandle),
            isSellableOnStorefront(bundleHandle),
          ]);
          const vs = bp?.variants.edges.map((e) => e.node) ?? [];
          if (!bp || vs.length === 0 || sellable === false) return null;
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

  // Display price = the FIRST bundle tier's price when tier 0 is bundle-backed
  // (owner decision 2026-07-10, verification pass §2.1): the Starter tier IS
  // the entry offer, so the hero price, sticky bar, final CTA "From $X" and
  // JSON-LD all quote it instead of the raw Shopify variant price. Falls back
  // to minVariantPrice when no tier-0 bundle exists (a composed tier 0 is
  // 1× device = the same number anyway). NOTE: collection/discovery
  // ProductCards still show minVariantPrice — if that drifts from the Starter
  // price in Shopify, the cross-page mismatch returns (punch-listed).
  const tierZero = tierBundles?.[0] ?? null;
  const displayPriceAmount = tierZero?.variants[0]?.priceAmount ?? minVariantPrice.amount;

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

  // "More from BeePaws" discovery band — CURATED ONLY (user decision
  // 2026-07-08): the band renders solely from beepaws.discovery_products
  // picks, and an empty/unset metafield means the section does not render at
  // all. (The earlier automatic catalog-fallback was removed — it put
  // uncontrolled output on the page.) Picks are deduped and resolved by
  // handle; unresolvable refs (draft/deleted), this product itself, and
  // bundle-tagged products (whose PDPs 404 by design) are dropped; capped at 6.
  const curatedHandles = [
    ...new Set(
      (beepaws?.discoveryProducts ?? [])
        .map((d) => d?.product?.handle)
        .filter((h): h is string => Boolean(h && h !== product.handle)),
    ),
  ];
  const discoveryProducts = curatedHandles.length
    ? (
        await Promise.all(curatedHandles.map((h) => getProduct(h)))
      )
        .filter((p): p is Product => Boolean(p && !p.tags?.includes("bundle")))
        .slice(0, 6)
    : [];

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
      price: displayPriceAmount,
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

      {/* Below-fold sections fade/rise in as they enter the viewport (same
          IntersectionObserver + .ds-reveal system as the homepage). The hero
          stays static — it's the LCP + the buy controls, which must be instant.
          <noscript> keeps everything visible when JS is off. */}
      <RevealObserver />
      <noscript
        dangerouslySetInnerHTML={{
          __html: "<style>.ds-reveal,.ds-stagger>*,.ds-reveal-in>*{opacity:1!important;transform:none!important}</style>",
        }}
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
        {/* min-w-0 on BOTH grid children: grid items default to min-width:auto,
            so one unshrinkable element in either column pushes the shared track
            (and the gallery card with it) past the viewport on phones — seen
            live as the hero rendering off-frame. */}
        <div className="grid gap-10 lg:grid-cols-[11fr_9fr] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <div className="lg:sticky lg:top-[7.5rem]">
              <ProductGallery
                productTitle={product.title}
                images={product.images.edges}
                fallbackUrl={fallbackUrl}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col lg:pb-16" style={{ overflowAnchor: "none" }}>
            {/* Eyebrow pill — DEVICE ONLY: the copy is scaler-specific and a
                consumable hero claiming "Vet-grade technology" would be
                wrong. Consumables run without an eyebrow until a metafield
                makes it authorable per product. */}
            {isDevice && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-honey-tint px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.07em] text-clay">
                Vet-grade technology · At home
              </span>
            )}

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
              fallbackAmount={displayPriceAmount}
              currencyCode={minVariantPrice.currencyCode}
              compareAtAmount={product.compareAtPriceRange?.minVariantPrice?.amount ?? null}
              fallbackAvailable={product.availableForSale}
            />

            {/* Vet-bill anchor — DEVICE ONLY (the copy literally claims
                ultrasonic hardware; it was hardcoded and rendered on every
                product, so a consumable PDP lied). Frames the price against
                the $500-$1,400+ vet quote per plan §"Anchoring rule"; never
                undercut against cheaper competitor devices. */}
            {isDevice && (
              <div className="mt-3 rounded-lg bg-honey-tint px-3.5 py-2.5 text-[13.5px] leading-snug text-brown">
                The same ultrasonic tool your vet uses behind that closed door —
                the one she charges <b className="text-rose-soft">$500–$1,400+</b>{" "}
                to swing once a year. Now it lives in your hand.
              </div>
            )}

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
            <div className="mt-6" id="buy-box" style={{ scrollMarginTop: "7.5rem" }}>
              <VariantSelector
                product={product}
                addonProducts={recommendedBundleProducts}
                paymentMethods={paymentMethods}
                educationNote={beepaws?.educationNote}
                bundleTiers={beepaws?.bundleTiers}
                tierBundles={tierBundles}
                sellingPlans={sellingPlans}
              />
            </div>

            {/* What's included — bundle products only (renders null otherwise) */}
            <BundleContents items={bundleItems} />

            {/* Mini-trust 3-up — matches device reference .mini-trust. Smaller,
                closer to the CTA than the previous full trust grid. */}
            <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
              {/* No forced <br/> — the columns get ~100px on a 320px phone and
                  the hard breaks doubled up with natural wrapping there. */}
              {/* Copy audit §1.10: "silent" is a banned absolute (honest hedges
                  beat hype) — "quiet in the air" states the physical fact. */}
              <li className="flex flex-col items-center gap-1 text-center text-[11.5px] font-bold text-brown">
                <ShieldCheck className="h-5 w-5 text-clay" aria-hidden />
                <span>Quiet in the air — even for skittish pets</span>
              </li>
              <li className="flex flex-col items-center gap-1 text-center text-[11.5px] font-bold text-brown">
                <Truck className="h-5 w-5 text-clay" aria-hidden />
                <span>Free shipping over $50</span>
              </li>
              <li className="flex flex-col items-center gap-1 text-center text-[11.5px] font-bold text-brown">
                <RefreshCcw className="h-5 w-5 text-clay" aria-hidden />
                <span>30-day, no-questions-asked return</span>
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
          Narrative order (reordered 2026-07-06/07): problem → mechanism →
          proof (visual, then social) → fit → comparison → FAQ → details →
          catalog discovery ("More from BeePaws", the exit ramp) → close.
          Band sequence: paper, cream, toffee, white, sand, cream, white,
          sand, sand, cream, bark — adjacent sections never share a hue except
          FAQ → ProductDetailsSections (they read as one "more info" block).
          WaveDividers are a KEPT design decision (user, 2026-07-08). ─────── */}

      {/* Hero → PainPoints — cream band + hairline so the buy area visibly
          ends and the story begins (the same-paper drift read as one
          unseparated blob; user feedback). */}
      <div className="border-t border-line">
        <PainPoints
          points={beepaws?.painPoints}
          eyebrow={blank(ppi?.eyebrow)}
          heading={blank(ppi?.heading)}
          lead={blank(ppi?.lead)}
        />
      </div>

      {isDevice ? (
        <>
          {/* WAVE — cream → toffee: the agitation resolves straight into
              Mechanism (Reason + 3-step + feels-broken cocoa-inset callout). */}
          <WaveDivider from="#FBF3E1" to="#E5C58C" />
          <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
            <Mechanism
              steps={beepaws?.mechanismSteps}
              // mechanism_intro.feelsBrokenBody, NOT education_note: that field
              // now holds only the short buy-column reassurance (§1.5) while
              // the callout gets its own long version (§4.10) — the two slots
              // wanted different lengths of the same message.
              feelsBrokenNote={blank(mi?.feelsBrokenBody)}
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
      ) : isConsumable ? (
        <>
          {/* Consumable-tagged: "What's inside" takes the Mechanism slot —
              same toffee band, same wave act-breaks, so consumable PDPs keep
              the device pages' rhythm. */}
          <WaveDivider from="#FBF3E1" to="#E5C58C" />
          <div style={{ marginTop: "-3px", position: "relative", zIndex: 1 }}>
            <IngredientsSection
              groups={beepaws?.ingredientGroups}
              legacyIngredients={beepaws?.ingredients}
              imageUrl={product.images.edges[0]?.node?.url ?? fallbackUrl}
              imageAlt={product.title}
              heading={blank(ii?.heading)}
              lead={blank(ii?.lead)}
            />
          </div>
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
        /* Neither device nor consumable tag: PainPoints meets
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

      {/* UGCReviews → UseCaseCards — proof lands first, then "made for the pet
          you actually have" answers the fit question the proof raises. */}
      <div className="border-t border-line">
        <UseCaseCards
          cards={beepaws?.useCases}
          eyebrow={blank(uci?.eyebrow)}
          heading={blank(uci?.heading)}
          lead={blank(uci?.lead)}
        />
      </div>

      {/* UseCaseCards → ComparisonTable — direct, hairline border. */}
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

      {/* "More from BeePaws" — curated catalog discovery, not an offer.
          Renders ONLY when beepaws.discovery_products has picks (empty
          metafield = no section; user decision 2026-07-08). Each card links
          to its own PDP so a shopper can read the full story before buying.
          Positioned as the EXIT RAMP at the end of the product story — after
          FAQ/details, before the promise close — so it never invites
          navigation away mid-argument, and the bark band stays the page's
          full-stop (the footer wave cap assumes bark above it). Replaces the
          checkbox FBT card — that duplicated the tier offer without its
          discount, and "Frequently bought together" claimed purchase data we
          don't have. */}
      {discoveryProducts.length > 0 && (
        <div className="ds-reveal-in border-t border-line bg-cream">
          <div className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-16">
            <h2 className="font-display mb-8 text-center text-2xl font-semibold tracking-tight text-cocoa md:text-3xl">
              More from BeePaws
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {discoveryProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  handle={p.handle}
                  title={p.title}
                  price={new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: p.priceRange.minVariantPrice.currencyCode,
                  }).format(parseFloat(p.priceRange.minVariantPrice.amount))}
                  imageUrl={p.images.edges[0]?.node?.url ?? fallbackUrl}
                  product={p}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Discovery (or details) → FinalCTA — hairline into the dark closing band. */}
      <div className="border-t border-line" style={{ position: "relative", zIndex: 1 }}>
        <FinalCTASection
          scrollTargetId="buy-box"
          fromPrice={new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: minVariantPrice.currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(parseFloat(displayPriceAmount))}
          heading={blank(fcc?.heading)}
          body={blank(fcc?.body)}
          smallPrint={blank(fcc?.smallPrint)}
          guarantee={beepaws?.guarantee}
        />
      </div>

      <StickyAddToCart
        product={product}
        // The sticky bar must ADD what it PRICES: when tier 0 is bundle-backed
        // it quick-adds the Starter bundle (one line, Shopify expands it) at
        // the same price the bar displays.
        quickAddBundle={
          tierZero
            ? {
                variantId: tierZero.variants[0].id,
                variantTitle:
                  tierZero.variants[0].selectedOptions.map((o) => o.value).join(" / ") || "Bundle",
                priceAmount: tierZero.variants[0].priceAmount,
                currencyCode: tierZero.currencyCode,
                available: tierZero.variants[0].availableForSale,
                handle: tierZero.handle,
                title: tierZero.title,
                imageUrl: tierZero.imageUrl,
                components: tierZero.components.map((c) => ({
                  quantity: c.quantity,
                  title: c.title,
                  imageUrl: c.imageUrl,
                })),
              }
            : null
        }
      />
    </div>
  );
}
