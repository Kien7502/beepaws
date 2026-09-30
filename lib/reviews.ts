// Customer reviews are switched OFF until real ones exist (owner, 2026-09-30).
//
// What sits in beepaws.reviews today was never a set of verified customer
// reviews, so nothing derived from it may reach a shopper: not the PDP's
// review section, not the hero's star rating, not the stars on product cards.
//
// The rating is gated where it is COMPUTED (lib/shopify/admin-catalog.ts), not
// where it is shown, so a future card, badge or sticky bar can't leak it by
// forgetting to check. The JSON-LD never carried a rating, so search engines
// weren't told anything either.
//
// The admin can keep authoring reviews meanwhile; flip this to true once they
// are real, and the section, hero rating and card stars all come back together.
export const SHOW_REVIEWS = false;
