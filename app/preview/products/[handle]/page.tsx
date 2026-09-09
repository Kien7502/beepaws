import { getFullProductForPage, getPaymentMethods, getProduct } from "@/lib/shopify/queries";
import { notFound } from "next/navigation";
import { ProductPageView } from "@/components/product/ProductPageView";
import { beepawsFromDraft, fetchAdminDraft } from "@/lib/shopify/draft-preview";

// Live preview for beepaws-admin (Phase B). Renders the exact PDP from either the
// admin's unsaved draft (default) or the PUBLISHED content (`?mode=published`), so
// the editor can show draft vs live side by side. Draft mode renders it with
// normalized.beepaws replaced by the admin's unsaved draft (fetched server-side
// from the local admin tool). Local/dev only — never a public draft viewer.
export const dynamic = "force-dynamic"; // never cache a draft

export default async function PreviewProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ admin?: string; mode?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.BEEPAWS_PREVIEW_ENABLED !== "1") {
    notFound();
  }
  const { handle } = await params;
  const { admin, mode } = await searchParams;
  const [fullProduct, product, paymentMethods, draft] = await Promise.all([
    getFullProductForPage(handle),
    getProduct(handle),
    getPaymentMethods(),
    // `?mode=published` skips the draft entirely, so the page renders from the
    // PUBLISHED Shopify content — the "live" half of the admin's compare view.
    // (The catalog cache is passthrough in dev, which is where preview runs, so
    // this is genuinely fresh; in a preview-enabled prod it would be ISR-aged.)
    mode === "published" ? Promise.resolve(null) : fetchAdminDraft(handle, admin),
  ]);
  if (!product || !fullProduct) return notFound();

  // Draft mode must never silently render the PUBLISHED page — that looks exactly
  // like a working draft preview and quietly misleads the editor (the homepage
  // preview has always said so; products used to fall through). Two distinct
  // failures, reported separately so the cause is obvious:
  //   draft === null      → couldn't reach the admin tool at all
  //   draft.exists false  → admin is up, but has no local file for this handle
  if (mode !== "published") {
    if (!draft) {
      return (
        <PreviewNotice title="Draft preview unavailable">
          Couldn&rsquo;t reach the BeePaws admin tool to load this product&rsquo;s draft. Start the
          admin app, then reload — or pass its port as{" "}
          <code className="rounded bg-honey-tint px-1.5 py-0.5 text-sm">?admin=3000</code>.
        </PreviewNotice>
      );
    }
    if (!draft.exists) {
      return (
        <PreviewNotice title="No local draft for this product">
          The admin tool is running, but it has no local content file for{" "}
          <code className="rounded bg-honey-tint px-1.5 py-0.5 text-sm">{handle}</code>. Open the
          product in the admin and Save once to create it.
        </PreviewNotice>
      );
    }
  }

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

// Shared "why you're not seeing a draft" panel. Mirrors the homepage preview so
// both routes fail the same, legible way instead of one of them going quiet.
function PreviewNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-cocoa">{title}</h1>
      <p className="mt-3 text-brown">{children}</p>
      <p className="mt-6 text-sm text-brown">
        To see what is currently live instead, use{" "}
        <code className="rounded bg-honey-tint px-1.5 py-0.5 text-sm">?mode=published</code>.
      </p>
    </main>
  );
}
