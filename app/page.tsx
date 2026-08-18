import { getHomepageBlocks } from '@/lib/shopify/homepage';
import { HomePageView } from '@/components/home/HomePageView';

// ISR: revalidate via webhook → revalidateTag("products"), or the homepage
// editor's own tag → revalidateTag("homepage") after a Publish.
export const revalidate = 3600;

// The live homepage: the shared view rendered with the PUBLISHED
// `beepaws.homepage` blocks. The markup lives in HomePageView so the preview
// route (app/preview/homepage) can render the same page from the admin's
// unsaved draft instead. Absent/empty metafield → {} → today's hardcoded page.
export default async function Home() {
  return <HomePageView blocks={await getHomepageBlocks()} />;
}
