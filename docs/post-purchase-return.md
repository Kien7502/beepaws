# Handoff → Shopify admin: post-purchase return to storefront

Addresses Finding 3 of the payment-frontend investigation: no post-purchase /
stale-cart handling existed anywhere (dead `clearCart()`, no return route, no
way to detect a cart was already used).

**Status (2026-07-26):** the storefront half is **BUILT**. What's documented
here is a real platform limitation, researched against current shopify.dev
docs and the Shopify dev community — not something fixable in this repo — plus
the one merchant-side action needed to actually trigger the redirect this
storefront now expects.

## The limitation (researched, not assumed)

Shopify's hosted checkout has **no supported return-URL parameter** for a
Storefront-API-created cart:

- The `Cart` object's `checkoutUrl` accepts no `return_to`/`return_url`
  argument. This has been asked about repeatedly in the Shopify dev community;
  the consistent answer is "not supported."
- The post-checkout Thank You / Order status page is served on Shopify's own
  checkout domain by design, and Shopify does not redirect off of it
  automatically for security/tracking reasons.
- The `Cart` object also has **no `completedAt` (or equivalent) field**. The
  old, now-deprecated Storefront `Checkout` object had one; it was not carried
  forward to `Cart`. Worse, `cart(id:)` keeps serving the *same* lines for a
  cart id after its order completes — Shopify does not null it out or mark it
  used. This is a documented gap other headless integrators have hit, not a
  bug in this codebase — see `components/cart/CartProvider.tsx`'s
  `COMPLETED_CART_IDS_KEY` comment for how the storefront compensates for it
  with its own locally-tracked ledger instead.

**Do not add a `completedAt` field to the `CartFields` fragment in
`lib/shopify/mutations.ts`** — it doesn't exist on the `Cart` type, and
querying an unknown field fails GraphQL validation for *every* cart request,
not just this one.

## What's supported instead

- `CartInput.attributes` is a real, schema-supported field. Every cart this
  storefront creates (`lib/shopify/cart-client.ts` `createCart`,
  `lib/shopify/storefront-cart.ts` `createCartWithLines`) now stamps a
  `return_url` attribute onto the cart via `buildReturnAttributes()` in
  `lib/shopify/mutations.ts`, pointing at `${NEXT_PUBLIC_SITE_URL}/thank-you`
  (no-op if that env var is unset). This does **not** make Shopify redirect on
  its own — it's the signal a merchant-side redirect mechanism can read.
- The two mechanisms Shopify actually supports for getting a customer back to
  a headless storefront after checkout:
  1. **All plans:** publish Shopify's official lightweight "Hydrogen redirect
     theme" on the store, pointed at this storefront's domain — it catches
     traffic landing on the `.myshopify.com`/checkout domain (including the
     order status page's "Continue shopping" link) and redirects it back.
  2. **Shopify Plus only:** a checkout script (Settings → Checkout → Order
     status page → Additional scripts) or a Checkout UI Extension /
     Checkout & Accounts editor app block that adds a link/redirect on the
     order status page.
  Either way, whoever configures it should target
  `{return_url attribute}?cart_id={the converted cart's id}` so `/thank-you`
  can record the exact cart that was purchased (see contract below). This is
  an **admin/store-configuration action**, not a code change — it needs a live
  store, which isn't available in this environment.

## Storefront contract: `/thank-you`

`app/thank-you/page.tsx` (client logic in
`components/checkout/ThankYouContent.tsx`) is the return route:

- Reads a **required** `?cart_id=` query param. Without it, the route does
  nothing to cart state — a bare, guessed, or stale `/thank-you` URL must
  never touch whatever the visitor currently has in their drawer.
- Always records the `cart_id` param as completed via `markCartCompleted()`
  in `CartProvider.tsx`, so it can never be resurrected on this browser.
- Only calls `clearCart()` (which resets cart state and clears
  `beepaws_shopify_cart_id` / `beepaws_local_cart_v1` from `localStorage`)
  when `cart_id` exactly matches the cart id this browser currently has
  stored. Buy It Now always builds a separate, unlinked cart from whatever is
  sitting in the drawer (see `app/api/shopify/cart/checkout/route.ts`), so a
  purchase completing elsewhere must not wipe an unrelated, still-active
  drawer cart.

On the next hydration, `CartProvider`'s restore effect checks any stored cart
id against that completed-ids ledger before re-fetching/re-presenting it, so a
cart known to be already used is treated as empty rather than re-offered with
a live "Checkout securely" button.

## Sequencing

Not launch-blocking on its own — the app already behaves safely with no
redirect configured (the customer just never lands on `/thank-you`, which is
the same "Low-Medium, inherent to the fully-hosted-checkout architecture" gap
the original report described). Wiring the actual Shopify-side redirect is a
follow-up once a real store/Plus plan is available to configure and test it.
