import { Suspense } from "react";
import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { ThankYouContent } from "@/components/checkout/ThankYouContent";

// One-time post-purchase confirmation — no catalog data, nothing worth
// caching, and it must run its cart-clearing effect on every fresh hit.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Thank you | Beepaws",
  description: "Your Beepaws order is confirmed.",
};

export default function ThankYouPage() {
  return (
    <SimpleArticle
      title="Thank you for your order!"
      description="Your purchase is confirmed — we're getting it ready to ship."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Thank you" }]}
    >
      <Suspense fallback={null}>
        <ThankYouContent />
      </Suspense>
    </SimpleArticle>
  );
}
