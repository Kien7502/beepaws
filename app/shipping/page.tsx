import Link from "next/link";
import { SimpleArticle } from "@/components/layout/SimpleArticle";

export const metadata = {
  title: "Shipping | Beepaws",
  description: "Shipping options and delivery information for Beepaws orders.",
};

export default function ShippingPage() {
  return (
    <SimpleArticle
      title="Shipping policy"
      description="How we get your pet supplies to your door."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Shipping" },
      ]}
    >
      <p>
        We offer standard and expedited shipping where available. Free standard
        shipping applies to qualifying orders over <strong>$50</strong> within
        supported regions.
      </p>
      <p>
        Orders are processed within 1–2 business days. You will receive an email
        with tracking once your package has shipped. Delivery times are estimates
        and may vary during peak seasons.
      </p>
      <p>
        For questions about a specific order, visit{" "}
        <Link href="/contact" className="font-semibold text-[var(--color-primary)] hover:underline">
          Contact
        </Link>
        .
      </p>
    </SimpleArticle>
  );
}
