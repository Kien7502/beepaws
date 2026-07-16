# Handoff from the admin repo (2026-07-16): PDP subscriptions + storefront-side copy

Two work items for this (storefront) repo, handed off from the beepaws-admin
session. Context lives in `../beepaws-admin/docs/BeePaws_Ultrasonic_Scaler_Page_Audit.md`
(the full copy audit) and `../beepaws-admin/CLAUDE.md` (§19 subscriptions decision).

---

## 1. PDP subscription selector ("Subscribe & Save")

**State of the world:** the store runs the official **Shopify Subscriptions app**,
which owns the selling plans and bills renewals (store is on Shopify Payments ✓).
A plan already exists on at least one product: group `subscribe-and-save`, plan
"Deliver every 2 weeks, 15% off". The admin tool shows plans read-only; **all
storefront work happens here.**

**What to build:**

1. **Query selling plans with the product.** The Storefront API exposes them on
   the product — no extra scope needed beyond what the storefront token has:
   ```graphql
   product {
     sellingPlanGroups(first: 5) {
       nodes {
         name
         options { name values }
         sellingPlans(first: 5) {
           nodes {
             id            # gid://shopify/SellingPlan/… — goes on the cart line
             name          # "Deliver every 2 weeks, 15% off"
             options { name value }
             priceAdjustments {
               adjustmentValue {
                 ... on SellingPlanPercentagePriceAdjustment { adjustmentPercentage }
                 ... on SellingPlanFixedAmountPriceAdjustment { adjustmentAmount { amount currencyCode } }
                 ... on SellingPlanFixedPriceAdjustment { price { amount currencyCode } }
               }
             }
           }
         }
       }
     }
   }
   ```
   Variant-level adjusted prices are also available via
   `variant.sellingPlanAllocations` (use these for the exact per-delivery price
   rather than computing the % yourself).

2. **PDP purchase-option selector.** When a product has ≥1 selling plan group,
   render a radio group near the price/CTA:
   - `One-time purchase — $24.95` (default)
   - `Subscribe & Save 15% — $21.21 / every 2 weeks` (from the allocation price)
   - Selecting a plan should update the displayed price. Products without plans
     render exactly as today (no selector).

3. **Cart line carries the plan.** `cartLinesAdd` / buy-now line input takes
   `sellingPlanId` alongside `merchandiseId`/`quantity`. That's the whole
   checkout integration — Shopify checkout handles the subscription agreement
   from there, and the Subscriptions app handles renewals + the customer's
   manage-subscription portal (new customer accounts show it natively).

4. **Copy guardrail** (from the brand synthesis): keep the subscribe option
   honest — say the cadence and the discount, no "cancel anytime" promises the
   portal doesn't back (it does allow cancelling; if you say it, it's true —
   just don't oversell). The guarantee block already promises "no subscription
   you can't cancel" — the selector copy must stay consistent with that.

**Testing limits:** the initial subscription checkout can't be end-to-end
verified until the store password comes off and payments are live (same as
bundle checkout). The selector rendering + cart line can be verified now.

---

## 2. Storefront-side items from the copy audit

The per-product metafield copy changes from the audit were applied in the admin
tool (product `pawspik-ultrasonic-dental-scaler` — needs a **Push** from the
editor to go live). These remaining items are **storefront components**, not
metafields — apply them here:

| Audit § | Component | Change |
|---|---|---|
| 1.9 | Trust badges under CTA | `30-day return, no questions asked · Free shipping over $50 · Real-person support` |
| 1.10 | Tertiary trust band (right of gallery) | `Quiet in the air, even for skittish pets · Free shipping over $50 · 30-day, no-questions-asked return` |
| 11.1 | Footer description | `BeePaws makes at-home pet wellness tools — dental and grooming — honestly priced against the real alternatives. No fake urgency, no hidden ingredients, no clinical trials we didn't actually run.` |
| 8.5/8.6 | Shared FAQ scaffolding | The returns FAQ + "what's in the box" label are candidates for a shared block (see audit) — optional refactor. |

**Verify one mapping:** the audit's §1.4 hero price-anchor copy ("The same
ultrasonic tool your vet uses behind that closed door…") was written into the
product's `beepaws.tagline` metafield on the assumption the PDP hero renders
`tagline` in that slot. If the price-anchor block is hardcoded instead, apply
§1.4's copy in the component and repurpose/ignore the tagline.

**One-field-two-slots gap:** `beepaws.education_note` now holds the audit's
§1.5 hero-reassurance copy. The §4.10 dark "feels broken" callout wants a
LONGER version of the same message — if that callout currently renders
`education_note`, either accept the short copy in both slots or add a separate
metafield/hardcoded body for the callout (audit §4.10 has the long copy).

**Data flags the audit raised (owner: human, not code):** Complete Care Kit
bundle contains two scalers instead of device+gel (§1.7); Family Pack "BEST
VALUE" badge with no real discount (§1.8); placeholder review identities +
stats ("10,000+", "4.8★", "10+ pet parents") must be replaced with verified
numbers before launch (§1.3, §6.4); Bella before/after photo is a placeholder
(§5.4 flag).
