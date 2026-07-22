import { getFullProductForPage, getPaymentMethods, getProduct } from "@/lib/shopify/queries";
import { getVariantGroupPrimary } from "@/lib/shopify/variant-groups";
import { notFound } from "next/navigation";
import { ProductPageView } from "@/components/product/ProductPageView";

// ISR: revalidate via webhook → revalidateTag("products")
// Fallback: re-generate every 1 hour even without a webhook push
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const [product, variantGroupPrimary] = await Promise.all([
    getProduct(handle),
    getVariantGroupPrimary(handle),
  ]);
  if (!product) return { title: "Not found | Beepaws" };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/products/${handle}`;
  // Variant-group members keep their own URLs but must not compete with the
  // primary in search (contract §2): canonical points at the page that
  // actually presents this product as an option.
  const canonicalUrl = variantGroupPrimary
    ? `${siteUrl}/products/${variantGroupPrimary}`
    : pageUrl;
  const title = `${product.seo?.title || product.title} | Beepaws`;
  const description = (product.seo?.description || product.description || "").slice(0, 160);
  const ogImage = product.images.edges[0]?.node?.url;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
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
  const { handle } = await params;
  // Parallel fetch — payment methods are shop-wide so they don't need the
  // product to resolve. Single round-trip latency instead of stacked.
  const [fullProduct, product, paymentMethods] = await Promise.all([
    getFullProductForPage(handle),
    getProduct(handle),
    getPaymentMethods(),
  ]);

  if (!product) return notFound();

  // Bundles are offers, not destinations: they're hidden from listings and
  // carry no authored beepaws.* content, so this shared view would render its
  // lorem placeholder sections for them. Direct URLs 404 instead (cart bundle
  // lines deliberately don't link here).
  if (product.tags?.includes("bundle")) return notFound();

  return (
    <ProductPageView product={product} fullProduct={fullProduct} paymentMethods={paymentMethods} handle={handle} />
  );
}
