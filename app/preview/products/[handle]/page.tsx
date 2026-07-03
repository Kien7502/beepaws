import { getFullProductForPage, getPaymentMethods, getProduct } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import { ProductPageView } from "@/components/product/ProductPageView";
import { beepawsFromDraft, fetchAdminDraft } from "@/lib/shopify/draft-preview";

// Live draft preview for beepaws-admin (Phase B). Renders the exact PDP, but with
// normalized.beepaws replaced by the admin's unsaved draft (fetched server-side
// from the local admin tool). Local/dev only — never a public draft viewer.
export const dynamic = "force-dynamic"; // never cache a draft

export default async function PreviewProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ admin?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.BEEPAWS_PREVIEW_ENABLED !== "1") {
    notFound();
  }
  const { handle } = await params;
  const { admin } = await searchParams;
  const [fullProduct, product, paymentMethods, draft] = await Promise.all([
    getFullProductForPage(handle),
    getProduct(handle),
    getPaymentMethods(),
    fetchAdminDraft(handle, admin),
  ]);
  if (!product || !fullProduct) return notFound();

  // Override ONLY the beepaws content (+ tags, for the isDevice gating) with the
  // draft; keep the base product (price/images/variants) and the other normalized
  // fields (usage_guide / qna / bundle_buy) from Shopify.
  const draftContent = draft?.exists ? draft.content : null;
  const mergedFull =
    draftContent && fullProduct.normalized
      ? { ...fullProduct, normalized: { ...fullProduct.normalized, beepaws: beepawsFromDraft(draftContent) } }
      : fullProduct;
  const draftTags = Array.isArray(draftContent?.tags) ? (draftContent!.tags as string[]) : null;
  const mergedProduct = draftTags ? { ...product, tags: draftTags } : product;

  return (
    <ProductPageView product={mergedProduct} fullProduct={mergedFull} paymentMethods={paymentMethods} handle={handle} />
  );
}
