import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SimpleArticle } from "@/components/layout/SimpleArticle";
import { LEGAL_POLICIES, getLegalPolicies, type LegalHandle } from "@/lib/shopify/policies";

// Shopify's own policy texts (Settings → Policies) on this site, in its design
// (2026-10-21): /policies/privacy-policy and /policies/terms-of-service. The
// owner edits them in Shopify only; this page re-checks hourly. A policy that
// isn't set in Shopify is a 404 (and its footer link isn't shown).
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_POLICIES.map((p) => ({ handle: p.handle }));
}

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const policy = (await getLegalPolicies())[handle as LegalHandle];
  return policy ? { title: `${policy.title} | BeePaws` } : {};
}

export default async function PolicyPage({ params }: Props) {
  const { handle } = await params;
  const policy = (await getLegalPolicies())[handle as LegalHandle];
  if (!policy) notFound();
  return (
    <SimpleArticle
      title={policy.title}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: policy.title },
      ]}
    >
      {/* Merchant-authored HTML from Shopify's admin — the owner's own text. */}
      <div className="policy-body" dangerouslySetInnerHTML={{ __html: policy.body }} />
    </SimpleArticle>
  );
}
