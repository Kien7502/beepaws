// GraphQL fragments & mutations for Shopify Storefront Cart API

const CART_FIELDS = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    lines(first: 100) {
      edges {
        node {
          id
          quantity
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
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
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
