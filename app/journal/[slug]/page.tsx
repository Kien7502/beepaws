import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListicleView } from "@/components/journal/ListicleView";
import { getListicle, getListicleSlugs, listicleProducts } from "@/lib/shopify/listicles";

// Listicles authored in the admin tool (2026-10-06): editorial landing pages for
// ads, one per shop metafield in `beepaws_listicles`. ISR like the PDP — every
// published slug prerenders, new ones render on demand and are cached; the
// admin's Publish revalidates the "listicles" tag. The site header and footer
// are left off on purpose (components/layout/SiteChrome.tsx): a single-purpose
// editorial page.
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getListicleSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListicle(slug);
  if (!l) return {};
  const title = l.seoTitle || l.headline;
  const description = l.seoDescription || l.subhead || undefined;
  return {
    title,
    description,
    openGraph: { title, description, images: l.hero.src ? [l.hero.src] : undefined, type: "article" },
  };
}

export default async function JournalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listicle = await getListicle(slug);
  if (!listicle) notFound();
  return <ListicleView listicle={listicle} products={await listicleProducts(listicle)} />;
}
