// GraphQL fragments & mutations for Shopify Storefront Cart API

/**
 * Shopify's hosted checkout has no supported return_url/return_to parameter on
 * the Cart API's checkoutUrl (confirmed against current shopify.dev docs and
 * the Shopify dev community — the Storefront Cart returned by cartCreate
 * carries no field for it, and the post-checkout Thank You / Order status page
 * lives on Shopify's own domain by design). CartInput.attributes IS a real,
 * schema-supported field, so this stamps the intended return URL onto the
 * cart as a plain key/value attribute — the signal a merchant-configured
 * redirect (Shopify Plus checkout script/UI extension, or the official
 * "Hydrogen redirect theme" that works on all plans) can read when sending
 * the customer back here. It does not make Shopify redirect on its own; see
 * docs/post-purchase-return.md.
 */
export function buildReturnAttributes(): { key: string; value: string }[] {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return site ? [{ key: "return_url", value: `${site}/thank-you` }] : [];
}

const CART_FIELDS = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            subtotalAmount { amount }
            totalAmount { amount }
          }
          sellingPlanAllocation {
            sellingPlan { id name }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              product {
                title
                handle
                images(first: 1) {
                  edges { node { url altText } }
                }
              }
            }
          }
        }
      }
    }
    cost {
      subtotalAmount { amount currencyCode }
    }
  }
`;

export const GQL_GET_CART = `
  ${CART_FIELDS}
  query GetCart($cartId: ID!) {
    cart(id: $cartId) { ...CartFields }
  }
`;

export const GQL_CART_CREATE = `
  ${CART_FIELDS}
  mutation CartCreate($lines: [CartLineInput!]!, $attributes: [AttributeInput!]) {
    cartCreate(input: { lines: $lines, attributes: $attributes }) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const GQL_CART_LINES_ADD = `
  ${CART_FIELDS}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const GQL_CART_LINES_UPDATE = `
  ${CART_FIELDS}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const GQL_CART_LINES_REMOVE = `
  ${CART_FIELDS}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;
