import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { getStoreInfo } from "@/lib/shopify/store-info";

export const metadata = {
  title: "Contact | BeePaws",
  description: "Get in touch with BeePaws for order help and questions.",
};

// The support email is set in the admin (Settings → Store details) and read
// here through the "store" cache tag, so changing it needs no deploy
// (2026-10-21). The demo contact form that sat here sent nothing anywhere, so it
// was removed: email only. Until an address is set, customers are pointed at
// their order confirmation email (replies reach the store).
// Also re-checked hourly: if Shopify can't be reached when the page is built (a
// one-off 401 hit this during a build, 2026-10-21), the fallback line mends
// itself instead of waiting for the next save in the admin.
export const revalidate = 3600;

export default async function ContactPage() {
  const { supportEmail } = await getStoreInfo();
  return (
    <SimpleArticle
      title="Contact us"
      description="Questions about an order, your plaque remover or a return? A real person reads every message."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Contact" },
      ]}
    >
      {supportEmail ? (
        <p>
          Email us at{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            {supportEmail}
          </a>
          . For an order, include your order number so we can help faster.
        </p>
      ) : (
        <p>
          Reply to your order confirmation email and a real person will get back to you.
        </p>
      )}
    </SimpleArticle>
  );
}
