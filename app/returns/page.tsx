import Link from "next/link";
import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { RETURN_DAYS } from "@/lib/store-policy";

export const metadata = {
  title: "Returns & Refunds | BeePaws",
  description: "Our 60-day promise: if it's not right for you or your dog, we'll refund you.",
};

// Matches the PDP's guarantee block and FAQ (60 days, full refund). The
// template's 30-day text and its food/personalised-item exclusions were left
// over from a demo store (launch prep, 2026-10-21).
export default function ReturnsPage() {
  return (
    <SimpleArticle
      title="Returns & refunds"
      description="Try it at home for 60 days. If it's not right, we'll refund you."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Returns" },
      ]}
    >
      <p>
        Every BeePaws order comes with our <strong>{RETURN_DAYS}-day promise</strong>. Use it at
        home for up to {RETURN_DAYS} days after delivery. If you don&apos;t see the hardened plaque chipping
        away, or it&apos;s simply not the right fit for your dog, return it for a full refund.
      </p>
      <p>
        To start a return, get in touch through{" "}
        <Link href="/contact" className="font-semibold text-[var(--color-primary)] hover:underline">
          Contact
        </Link>{" "}
        with your order number. A real person reads every message and will reply with the
        return steps.
      </p>
    </SimpleArticle>
  );
}
