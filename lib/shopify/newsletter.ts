import "server-only";

import { adminGraphqlFetch } from "./admin-graphql";

/**
 * Newsletter sign-up (footer form, 2026-10-26): the email becomes a Shopify
 * customer with email-marketing consent (single opt-in) — Shopify Email can
 * send to them now, and Klaviyo imports Shopify's subscribers later. New
 * customers get the tag "newsletter". An existing customer just gets their
 * consent switched on. Needs the app's read_customers + write_customers scopes.
 */

export const NEWSLETTER_TAG = "newsletter";

/** Plain address check; quotes/backslashes refused so the email can go into a
 *  customer search query safely. */
export function cleanEmail(raw: unknown): string | null {
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return email.length <= 254 && /^[^\s@"\\]+@[^\s@"\\]+\.[^\s@"\\]+$/.test(email) ? email : null;
}

type UserErrors = { userErrors?: { field?: string[] | null; message: string }[] };

const consent = () => ({
  marketingState: "SUBSCRIBED",
  marketingOptInLevel: "SINGLE_OPT_IN",
  consentUpdatedAt: new Date().toISOString(),
});

async function findCustomer(email: string) {
  const res = await adminGraphqlFetch<{
    data?: { customers?: { nodes: { id: string; email: string | null; emailMarketingConsent: { marketingState: string } | null }[] } };
  }>({
    query: `query nlFind($q: String!) { customers(first: 5, query: $q) { nodes { id email emailMarketingConsent { marketingState } } } }`,
    variables: { q: `email:"${email}"` },
  });
  // The search can match loosely; only an exact address counts.
  return res.body.data?.customers?.nodes.find((c) => c.email?.toLowerCase() === email) ?? null;
}

async function setConsent(customerId: string) {
  const res = await adminGraphqlFetch<{ data?: { customerEmailMarketingConsentUpdate?: UserErrors } }>({
    query: `mutation nlConsent($input: CustomerEmailMarketingConsentUpdateInput!) {
      customerEmailMarketingConsentUpdate(input: $input) { userErrors { field message } } }`,
    variables: { input: { customerId, emailMarketingConsent: consent() } },
  });
  const errors = res.body.data?.customerEmailMarketingConsentUpdate?.userErrors ?? [];
  if (errors.length) throw new Error(`newsletter: consent not saved: ${errors.map((e) => e.message).join("; ")}`);
}

/** Subscribes the address. Resolves the same way whether or not it was already
 *  a customer, so the form never reveals who shops here. */
export async function subscribeEmail(email: string): Promise<void> {
  const existing = await findCustomer(email);
  if (existing) {
    if (existing.emailMarketingConsent?.marketingState !== "SUBSCRIBED") await setConsent(existing.id);
    return;
  }
  const res = await adminGraphqlFetch<{ data?: { customerCreate?: UserErrors & { customer?: { id: string } | null } } }>({
    query: `mutation nlCreate($input: CustomerInput!) { customerCreate(input: $input) { customer { id } userErrors { field message } } }`,
    variables: { input: { email, tags: [NEWSLETTER_TAG], emailMarketingConsent: consent() } },
  });
  const payload = res.body.data?.customerCreate;
  if (payload?.customer?.id) return;
  const errors = payload?.userErrors ?? [];
  // Created a moment ago by another request (customer search lags behind new
  // customers): that one carries the consent already.
  if (errors.some((e) => /taken/i.test(e.message))) return;
  throw new Error(`newsletter: customer not created: ${errors.map((e) => e.message).join("; ") || "no id"}`);
}
