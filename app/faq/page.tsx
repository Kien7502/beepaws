import { SimpleArticle } from "@/components/layout/SimpleArticle";

export const metadata = {
  title: "FAQ | Beepaws",
  description: "Answers to common questions about shopping at Beepaws.",
};

export default function FaqPage() {
  return (
    <SimpleArticle
      title="Frequently asked questions"
      description="Quick answers about orders, shipping, and returns."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "FAQ" },
      ]}
    >
      <section className="space-y-8">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-2">
            Do you ship internationally?
          </h2>
          <p>
            Shipping zones and rates depend on your connected fulfillment setup.
            This storefront is a demo—configure regions in your Shopify admin for
            production.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-2">
            How long does delivery take?
          </h2>
          <p>
            Typical domestic orders arrive within 3–7 business days after
            dispatch. You will receive tracking when your order ships.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-2">
            Can I change or cancel my order?
          </h2>
          <p>
            Contact us as soon as possible. Once an order is packed or shipped,
            changes may not be possible—see our returns policy for next steps.
          </p>
        </div>
      </section>
    </SimpleArticle>
  );
}
