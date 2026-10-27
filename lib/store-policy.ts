// The shipping and refund facts the storefront states (launch, 2026-10-21;
// refund policy approved by the owner 2026-10-27). The shipping, returns and FAQ
// pages AND the product's structured data (what Google reads) all take them from
// here, so they can't disagree. Keep them in step with Shopify's shipping setup,
// Shopify's refund policy text (admin docs/shopify-policies.md) and the PDP's
// guarantee copy.

/** Where we ship. US only (owner, 2026-10-21). */
export const SHIPS_TO = { code: "US", name: "United States" } as const;

/** Business days from order to shipped: HyperSKU's 1–3 days plus up to a day
 *  for the 24-hour cancel window (auto-pay is OFF, orders are paid to HyperSKU
 *  once that window has passed — owner, 2026-10-23). */
export const HANDLING_DAYS = { min: 2, max: 4 } as const;

/** Days from shipped to delivered (owner, from the HyperSKU dashboard). */
export const TRANSIT_DAYS = { min: 5, max: 9 } as const;

/** The one shipping option: Standard, this rate (USD) on every order.
 *  Owner, 2026-10-21: Standard only (no Express) at $10, and NO free-over-$X
 *  threshold (dropped on purpose): kits ship free through the admin's "Free
 *  shipping on kits" switch instead, whose cap ("free on rates up to") must stay
 *  at or above this rate. */
export const STANDARD_RATE = 10;

/** The 60-day promise: a full refund if it doesn't work for the dog, after we've
 *  tried to help and seen a photo or short video of the problem. No return —
 *  there's nowhere to send items back to (HyperSKU has no return address). */
export const PROMISE_DAYS = 60;

/** Hours after ordering in which an order can still be cancelled in full. */
export const CANCEL_HOURS = 24;

/** Days after delivery to report a damaged, faulty, wrong or missing item
 *  (HyperSKU's own claim window, so every such refund can be claimed back). */
export const CLAIM_DAYS = 7;

/** Days within which an approved refund is paid. */
export const REFUND_DAYS = 7;

/** A change of mind after the cancel window gets a code, not a refund. */
export const CHANGE_OF_MIND_CODE = { percent: 20, validDays: 90 } as const;

export const range = (r: { min: number; max: number }) => `${r.min}–${r.max}`;
