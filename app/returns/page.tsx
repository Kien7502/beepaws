import Link from "next/link";
import { SimpleArticle } from "@/components/layout/SimpleArticle";

export const metadata = {
  title: "Returns & Refunds | Beepaws",
  description: "Returns, exchanges, and refund information for Beepaws.",
};

export default function ReturnsPage() {
  return (
    <SimpleArticle
      title="Returns & refunds"
      description="We want you and your pet to love every purchase."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Returns" },
      ]}
    >
      <p>
        If you are not satisfied, you may return most unused items within{" "}
        <strong>30 days</strong> of delivery for a refund or exchange, subject to
        product condition and our return authorization process.
      </p>
      <p>
        Open food, personalized items, or products marked as final sale may not be
        eligible. Original packaging helps us process your return faster.
      </p>
      <p>
        To start a return, reach out through{" "}
        <Link href="/contact" className="font-semibold text-[var(--color-primary)] hover:underline">
          Contact
        </Link>{" "}
        with your order number.
      </p>
    </SimpleArticle>
  );
}
