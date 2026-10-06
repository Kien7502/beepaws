import { notFound } from "next/navigation";
import { ListicleView } from "@/components/journal/ListicleView";
import { fetchAdminListicleDraft } from "@/lib/shopify/draft-preview";
import { listicleProducts, sanitizeListicle } from "@/lib/shopify/listicles";

// Live preview of a listicle DRAFT for the admin tool's editor:
//   /preview/listicles/<draft id>?admin=<port>
// The published page is simply /journal/<slug>. Local/dev only, same guard as
// the other preview routes — never a public viewer.
export const dynamic = "force-dynamic"; // never cache a preview

export default async function PreviewListicle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ admin?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.BEEPAWS_PREVIEW_ENABLED !== "1") {
    notFound();
  }
  const [{ id }, { admin }] = await Promise.all([params, searchParams]);
  const raw = await fetchAdminListicleDraft(id, admin);

  if (!raw) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-cocoa">Draft preview unavailable</h1>
        <p className="mt-3 text-brown">
          Couldn&rsquo;t load this listicle draft from the BeePaws admin tool. Start the admin app, then reload — or
          pass its port as{" "}
          <code className="rounded bg-honey-tint px-1.5 py-0.5 text-sm">?admin=3000</code>.
        </p>
      </main>
    );
  }

  // The draft is untrusted input like any metafield — same filter as published.
  const listicle = sanitizeListicle(raw);
  return <ListicleView listicle={listicle} products={await listicleProducts(listicle)} preview />;
}
