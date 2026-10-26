import Link from "next/link";
import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { PrivacyChoice } from "@/components/privacy/PrivacyChoice";
import { getStoreInfo } from "@/lib/shopify/store-info";

export const metadata = {
  title: "Your Privacy Choices | BeePaws",
  description: "Opt out of the sale or sharing of your personal information.",
};

// Where the privacy policy's opt-out links land (2026-10-26): Shopify's text
// links /pages/data-sharing-opt-out on the Shopify-hosted store, which the
// redirect theme sends here (the path is kept), and next.config.ts redirects
// that path to this page. "No trackers today" is TRUE as of 2026-10-26 — adding
// a pixel means updating this page and gating it on optedOut()
// (lib/privacy-choice.ts). Same support email + hourly refresh as /contact.
export const revalidate = 3600;

export default async function PrivacyChoicesPage() {
  const { supportEmail } = await getStoreInfo();
  return (
    <SimpleArticle
      title="Your privacy choices"
      description="Opt out of the sale or sharing of your personal information."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Your privacy choices" },
      ]}
    >
      <p>
        We don&apos;t sell your personal information. This website doesn&apos;t use advertising or
        analytics trackers today. If we add any, they won&apos;t run for visitors who have opted out
        here.
      </p>
      <PrivacyChoice />
      <p>
        Your choice is saved in this browser. To opt out everywhere, including on other devices and
        for the email address you order with,{" "}
        {supportEmail ? (
          <>
            email us at{" "}
            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent("Do not sell or share")}`}
              className="font-semibold text-[var(--color-primary)] hover:underline"
            >
              {supportEmail}
            </a>{" "}
            with the subject &ldquo;Do not sell or share&rdquo;.
          </>
        ) : (
          <>reply to your order confirmation email with &ldquo;Do not sell or share&rdquo;.</>
        )}
      </p>
      <p>
        Checkout is run by Shopify, our commerce platform. How your order details are handled is
        described in our{" "}
        <Link href="/policies/privacy-policy" className="font-semibold text-[var(--color-primary)] hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </SimpleArticle>
  );
}
