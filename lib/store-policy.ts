// The shipping and returns facts the storefront states (launch, 2026-10-21).
// The shipping, returns and FAQ pages AND the product's structured data (what
// Google reads) all take them from here, so they can't disagree. Keep them in
// step with Shopify's shipping setup and the PDP's guarantee copy.

/** Where we ship. US only (owner, 2026-10-21). */
export const SHIPS_TO = { code: "US", name: "United States" } as const;

/** Business days from order to shipped (HyperSKU's processing time). */
export const HANDLING_DAYS = { min: 1, max: 3 } as const;

/** Days from shipped to delivered (owner, from the HyperSKU dashboard). */
export const TRANSIT_DAYS = { min: 5, max: 9 } as const;

/** The one shipping option: Standard, this rate (USD) on every order.
 *  Owner, 2026-10-21: Standard only (no Express) at $10, and NO free-over-$X
 *  threshold (dropped on purpose): kits ship free through the admin's "Free
 *  shipping on kits" switch instead, whose cap ("free on rates up to") must stay
 *  at or above this rate. */
export const STANDARD_RATE = 10;

/** The 60-day promise (PDP guarantee block + FAQ). */
export const RETURN_DAYS = 60;

export const range = (r: { min: number; max: number }) => `${r.min}–${r.max}`;
