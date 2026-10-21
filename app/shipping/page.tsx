import Link from "next/link";
import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { kitShippingEnabled } from "@/lib/shopify/kit-shipping";
import { FREE_STANDARD_OVER, HANDLING_DAYS, SHIPS_TO, STANDARD_RATE, TRANSIT_DAYS, range } from "@/lib/store-policy";

export const metadata = {
  title: "Shipping | BeePaws",
  description: "Where we ship, how long it takes, and what it costs.",
};

// The numbers come from lib/store-policy.ts (shared with the FAQ page and the
// product's structured data); change them there. The kit sentence follows the
// admin's "Free shipping on kits" switch, read through the same cached,
// `products`-tagged lookup as the PDP, so switching it refreshes this page too.
// Re-checked hourly too, so a build that couldn't reach Shopify mends itself.
export const revalidate = 3600;

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
        We ship within the <strong>{SHIPS_TO.name}</strong>.
      </p>
      <p>
        <strong>Processing:</strong> orders leave our warehouse within {range(HANDLING_DAYS)} business
        days. You&apos;ll get an email with your tracking link as soon as yours ships.
      </p>
      <p>
        <strong>Delivery:</strong> most orders arrive about {range(TRANSIT_DAYS)} days after they ship.
      </p>
      <p>
        <strong>Cost:</strong> ${STANDARD_RATE} standard shipping, free on orders over $
        {FREE_STANDARD_OVER}
        {kitsShipFree ? " and on every kit" : ""}.
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
