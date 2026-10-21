import { SimpleArticle } from "@/components/layout/SimpleArticle";

export const metadata = {
  title: "Contact | BeePaws",
  description: "Get in touch with BeePaws for order help and questions.",
};

// The one support address (launch prep, 2026-10-21). The demo contact form that
// sat here sent nothing anywhere, so it was removed: email only.
const SUPPORT_EMAIL = "hello@beepaws.example";

export default function ContactPage() {
  return (
    <SimpleArticle
      title="Contact us"
      description="Questions about an order, your plaque remover or a return? A real person reads every message."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Contact" },
      ]}
    >
      <p>
        Email us at{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold text-[var(--color-primary)] hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
        . For an order, include your order number so we can help faster.
      </p>
    </SimpleArticle>
  );
}
