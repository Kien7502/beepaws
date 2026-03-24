import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = {
  title: "Contact | Beepaws",
  description: "Get in touch with Beepaws for order help and questions.",
};

export default function ContactPage() {
  return (
    <SimpleArticle
      title="Contact us"
      description="We are here to help with orders, products, and general questions."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Contact" },
      ]}
    >
      <p>
        Email{" "}
        <a
          href="mailto:hello@beepaws.example"
          className="font-semibold text-[var(--color-primary)] hover:underline"
        >
          hello@beepaws.example
        </a>{" "}
        or use the form below (demo—does not send data yet).
      </p>
      <ContactForm />
    </SimpleArticle>
  );
}
