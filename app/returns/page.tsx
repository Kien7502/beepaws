import type { ReactNode } from "react";
import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { getStoreInfo } from "@/lib/shopify/store-info";
import { CANCEL_HOURS, CHANGE_OF_MIND_CODE, CLAIM_DAYS, PROMISE_DAYS, REFUND_DAYS } from "@/lib/store-policy";

export const metadata = {
  title: "Returns & Refunds | BeePaws",
  description: `Our ${PROMISE_DAYS}-day promise: if it doesn't work for your dog, we'll refund you in full.`,
};

// The refund policy the owner approved on 2026-10-27 — the same text as Shopify's
// refund policy (admin docs/shopify-policies.md); change both together. Numbers
// come from lib/store-policy.ts. Nothing is sent back: there's no return address
// (HyperSKU ships from overseas), so a promise refund leaves the item with the
// customer. Wording rule: never "money-back guarantee" / "risk-free" / "no
// questions" (FTC 16 CFR 239.3 — a change of mind gets a code, not a refund).
// Support email: the admin's Store details, refreshed hourly like /contact.
export const revalidate = 3600;

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-2">{children}</h2>
);

export default async function ReturnsPage() {
  const { supportEmail } = await getStoreInfo();
  const email = supportEmail ? (
    <a href={`mailto:${supportEmail}`} className="font-semibold text-[var(--color-primary)] hover:underline">
      {supportEmail}
    </a>
  ) : null;
  const contact = email ? <>email {email}</> : <>reply to your order confirmation email</>;

  return (
    <SimpleArticle
      title="Returns & refunds"
      description={`Our ${PROMISE_DAYS}-day promise, canceling an order, and what to do if something arrives damaged.`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Returns" },
      ]}
    >
      <section className="space-y-8">
        <div>
          <H2>Cancel within {CANCEL_HOURS} hours</H2>
          <p>
            Changed your mind, or picked the wrong color or kit? Within {CANCEL_HOURS} hours of ordering,
            use the button in your order confirmation email, or {contact} with your order number.
            We&apos;ll cancel your order for a full refund, and you&apos;re free to place a new one. After{" "}
            {CANCEL_HOURS} hours, your order is with our warehouse and can&apos;t be canceled.
          </p>
        </div>

        <div>
          <H2>Our {PROMISE_DAYS}-day promise</H2>
          <p>
            Use your BeePaws product for up to {PROMISE_DAYS} days after it&apos;s delivered. If it doesn&apos;t
            work for your dog (for example, your dog still won&apos;t tolerate the plaque remover after the
            Calm Start Protocol, or you&apos;re not seeing the plaque coming away), {contact} and tell us what
            happened. We&apos;ll help you troubleshoot first. If it still isn&apos;t working, we&apos;ll give you a
            full refund. In most cases you won&apos;t need to send anything back.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>We&apos;ll ask for a photo or a short video that shows the problem.</li>
            <li>Damage from drops, chewing, or misuse isn&apos;t covered.</li>
            <li>A change of mind isn&apos;t covered (see below).</li>
          </ul>
        </div>

        <div>
          <H2>Changed your mind after {CANCEL_HOURS} hours</H2>
          <p>
            Once your order is with our warehouse, we can&apos;t refund a change of mind. Let us know anyway:
            we&apos;ll send you a code for {CHANGE_OF_MIND_CODE.percent}% off your next order, valid for{" "}
            {CHANGE_OF_MIND_CODE.validDays} days.
          </p>
        </div>

        <div>
          <H2>Damaged, faulty, wrong or missing items</H2>
          <p>
            Tell us within {CLAIM_DAYS} days of delivery, with photos of the items and the shipping label.
            We&apos;ll send a replacement or give you a full refund, at no cost to you. Small cosmetic marks
            that don&apos;t affect how it works aren&apos;t covered.
          </p>
        </div>

        <div>
          <H2>Lost parcels</H2>
          <p>
            If your tracking says delivered but the parcel never reached you, {contact} and we&apos;ll send a
            replacement or refund you.
          </p>
        </div>

        <div>
          <H2>Exchanges</H2>
          <p>
            We don&apos;t offer exchanges. If you ordered the wrong color or kit, cancel within{" "}
            {CANCEL_HOURS} hours for a full refund and place a new order.
          </p>
        </div>

        <div>
          <H2>How refunds are paid</H2>
          <p>
            Approved refunds go back to your original payment method within {REFUND_DAYS} days. Your bank
            may take a few more days to post the refund.
          </p>
        </div>

        <p>
          Questions? {email ? <>Email {email} with your order number.</> : <>Reply to your order confirmation email.</>}{" "}
          A real person reads every message.
        </p>
      </section>
    </SimpleArticle>
  );
}
