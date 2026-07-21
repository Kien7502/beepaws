# Handoff from the admin repo (2026-07-21): variant groups (combined listings, in our code)

**New contract — nothing in this repo reads it yet.** Everything else the admin
tool recently shipped (composed kits, kit discounts, tier gifts, the free-gift
discount) is already consumed here; this is the one outstanding piece.

## The need

One product page for products that differ only by flavour — two oral sprays
today. The obvious approach (merge them into a single Shopify product with
variants) was built, tested against the live store, and **abandoned**. Recording
why, so nobody rebuilds it:

- Every Shopify variant owns its own **inventory item**. Shopify does **not**
  link inventory between variants that share a SKU — it only warns that
  duplicate SKUs "cause issues with third-party integrations and inventory
  tracking". Verified live: changing stock in HyperSKU moved the source product
  only, never the merged one.
- **HyperSKU only syncs products it imported**, and offers no "map to an
  existing variant" option (owner checked). A merged product is therefore
  detached from supplier stock *permanently*.
- Shopify's own feature for this, **Combined Listings**, is **Plus-only**
  (~$2,300/mo); third-party equivalents are Liquid-theme apps — useless headless.

So we implement the Combined-Listings *pattern* here: each flavour stays its own
Shopify product (fully HyperSKU-synced), and the storefront presents them as one
page. Same philosophy as composed kits — compose at the storefront layer instead
of fighting the platform's data model.

**The admin's merge feature has been deleted** (page, routes, adapter methods),
so no new merged products can appear.

## What the admin authors

On the **primary** product — the one whose PDP is canonical:

| Metafield | Shape | Meaning |
|---|---|---|
| `beepaws.variant_group_label` | `string` | Picker label — "Flavor", "Scent", … |
| `beepaws.variant_group` | `[{ product: { id, handle, title }, label: string }]` | Every member **including the primary**, in display order |

`product` is the same `product_ref` shape as `discovery_products` and kit
components — **resolve by handle**. Absent/empty `variant_group` = an ordinary
product; render exactly as today.

Labels live in the metafield on purpose: **HyperSKU overwrites product titles
when it syncs**, so the picker must not read Shopify titles.

## Contract

1. **PDP (primary):** render a picker labelled `variant_group_label`, one entry
   per row. Selecting an option shows THAT product's price / images /
   availability, and add-to-cart uses **that product's** variant (its own
   variant picker still applies if it has real variants). Each member is an
   independent product — no shared inventory, no shared price.
2. **PDP (member opened directly):** members keep their own URLs. Either
   redirect to the primary with the option preselected, or render with
   `<link rel="canonical">` pointing at the primary — don't leave competing
   pages in search.
3. **Listings ("Shop all", collections):** show the **primary only**, hide the
   other members. Derive membership from the metafield (a product is a member if
   it appears in some other product's `variant_group`) rather than tags, so
   there's no second source of truth. Members **must stay published** — the
   Storefront API can't fetch unpublished products, and the PDP needs their
   variants for the cart.
4. **Sellability:** honour each member's own `availableForSale`. Show an
   unavailable flavour disabled rather than hidden, so the choice stays legible.
5. **Never derive stock numbers.** Dropship items park a placeholder quantity
   (99999, policy CONTINUE) and the Storefront API returns
   `quantityAvailable: null` anyway — `availableForSale` is the only honest
   signal. (Merged/manually-created products legitimately sit at quantity 0 with
   CONTINUE and are perfectly purchasable.)

## Related admin-side changes worth knowing

- **Merge removed** (2026-07-21) — see above.
- **SKU copying removed** from the old merge: it produced Shopify's duplicate-SKU
  warning and zero linkage.
- The existing merged product ("Beepaws oral spray") is being **archived** by the
  owner; the two sprays return to being separate, synced products joined by a
  variant group. Expect the group to be authored on one of the sprays.
