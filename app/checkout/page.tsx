import Link from "next/link";
import { redirect } from "next/navigation";
import { getHostedStoreCartUrl } from "@/lib/shopify/domain";

export const metadata = {
  title: "Cart | Beepaws",
  description: "Your cart is hosted securely by Shopify.",
};

export default function CheckoutPage() {
  const cartUrl = getHostedStoreCartUrl();

  if (cartUrl) {
    redirect(cartUrl);
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 max-w-lg text-center">
      <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-foreground)] mb-4">
        Cart on Shopify
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        Set{" "}
        <code className="rounded bg-[var(--color-secondary)] px-1.5 py-0.5 text-sm">
          NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
        </code>{" "}
        (your-store.myshopify.com) in{" "}
        <code className="rounded bg-[var(--color-secondary)] px-1.5 py-0.5 text-sm">
          .env.local
        </code>
        . Optionally set{" "}
        <code className="rounded bg-[var(--color-secondary)] px-1.5 py-0.5 text-sm">
          NEXT_PUBLIC_SHOPIFY_ONLINE_STORE_URL
        </code>{" "}
        if the storefront uses a custom primary domain. Then this page will open
        your live Shopify cart.
      </p>
      <Link
        href="/collections/all"
        className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-3 font-bold text-white hover:opacity-95"
      >
        Continue shopping
      </Link>
    </div>
  );
}
