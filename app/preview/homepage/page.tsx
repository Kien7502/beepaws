import { notFound } from "next/navigation";
import { HomePageView } from "@/components/home/HomePageView";
import {
  getPublishedHomepageBlocksUncached,
  sanitizeHomepage,
} from "@/lib/shopify/homepage";
import { fetchAdminHomepageDraft } from "@/lib/shopify/draft-preview";

// Live homepage preview for beepaws-admin — the exact homepage, rendered from
// either the admin's UNSAVED draft or what is actually PUBLISHED, so the editor
// can show them side by side before a Publish lands.
//
//   /preview/homepage                     → draft (default)
//   /preview/homepage?mode=published      → the live metafield, UNCACHED
//   …&admin=<port>                        → admin tool's port (draft mode)
//
// Local/dev only, same guard as the product preview — never a public viewer.
export const dynamic = "force-dynamic"; // never cache a preview

export default async function PreviewHomepage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; admin?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.BEEPAWS_PREVIEW_ENABLED !== "1") {
    notFound();
  }
  const { mode, admin } = await searchParams;

  // `published` reads FRESH (not the ISR-cached path): a comparison panel that
  // showed hour-old content would misreport what is live.
  if (mode === "published") {
    return <HomePageView blocks={await getPublishedHomepageBlocksUncached()} />;
  }

  const draft = await fetchAdminHomepageDraft(admin);

  // Admin unreachable: say so rather than render the published page, which
  // would look like a draft preview and quietly mislead the editor.
  if (!draft) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-cocoa">
          Draft preview unavailable
        </h1>
        <p className="mt-3 text-brown">
          Couldn&rsquo;t reach the BeePaws admin tool to load the homepage draft. Start the
          admin app, then reload — or pass its port as{" "}
          <code className="rounded bg-honey-tint px-1.5 py-0.5 text-sm">?admin=3000</code>.
        </p>
        <p className="mt-6 text-sm text-brown">
          To see what is currently live instead, use{" "}
          <code className="rounded bg-honey-tint px-1.5 py-0.5 text-sm">?mode=published</code>.
        </p>
      </main>
    );
  }

  // The draft is untrusted input like any metafield — same filter as published.
  return <HomePageView blocks={sanitizeHomepage({ blocks: draft.blocks })} />;
}
