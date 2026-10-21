import Link from "next/link";
import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { kitShippingEnabled } from "@/lib/shopify/kit-shipping";

export const metadata = {
  title: "Shipping | BeePaws",
  description: "Where we ship, how long it takes, and what it costs.",
};

// Facts as of launch prep (2026-10-21): processing 1–3 business days (HyperSKU),
// delivery about 5–9 days after shipping (owner, from the HyperSKU dashboard),
// free Standard shipping over $70 (the store's General shipping profile). Keep
// in step with Shopify if any of those change. The kit sentence follows the
// admin's "Free shipping on kits" switch, read through the same cached,
// `products`-tagged lookup as the PDP, so switching it refreshes this page too.
export default async function ShippingPage() {
  const kitsShipFree = await kitShippingEnabled();
  return (
    <SimpleArticle
      title="Shipping"
      description="Where we ship, how long it takes, and what it costs."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Shipping" },
      ]}
    >
      <p>
        We ship within the <strong>United States</strong>.
      </p>
      <p>
        <strong>Processing:</strong> orders leave our warehouse within 1–3 business days.
        You&apos;ll get an email with your tracking link as soon as yours ships.
      </p>
      <p>
        <strong>Delivery:</strong> most orders arrive about 5–9 days after they ship.
      </p>
      <p>
        <strong>Cost:</strong> standard shipping is free on orders over $70
        {kitsShipFree ? " and on every kit" : ""}. Otherwise it&apos;s calculated at
        checkout, where you can also choose Express.
      </p>
      <p>
        Questions about an order? Get in touch through{" "}
        <Link href="/contact" className="font-semibold text-[var(--color-primary)] hover:underline">
          Contact
        </Link>
        .
      </p>
    </SimpleArticle>
  );
}
