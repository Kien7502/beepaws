# Using bundles created by beepaws-admin (storefront side)

> For whoever works in **this** (`beepaws` storefront) repo. The sibling **beepaws-admin** tool
> can now create **Shopify product bundles** (`/bundles`). This explains what those are, how they
> differ from the storefront's existing "bundle" UI, and what (if anything) the storefront needs
> to do to use them.

## ⚠ First: two different "bundle" things — don't conflate

| | What it is | Cart behavior |
|---|---|---|
| **Admin bundles** (this doc) | A **real Shopify product** created via `productBundleCreate`, tagged **`bundle`**, whose variant has `requiresComponents` and is wired to component products. | Shopper buys **one product** (the bundle); Shopify **expands it into the component line items at checkout**. One thing in the cart. |
| **`BundleBuyCard`** (existing, `components/product/BundleBuyCard.tsx`) | A **client-side "Frequently Bought Together"** UI — current product + recommended products with checkboxes. | Adds each product as a **separate cart line item**. Not a Shopify bundle. |
| **`bundleTiers`** (existing, `beepaws.bundle_tiers` → VariantSelector) | Per-tier **copy** for the in-page Starter/Complete/Family picker. | UI composition, not a Shopify bundle product. |

The admin bundles are the only "real" Shopify bundles. The other two are storefront UX and are
unaffected by this.

## What an admin bundle looks like (Shopify)

- A standalone product at **`/products/<bundle-handle>`**, **tagged `bundle`**.
- Created as **DRAFT** by default (publish in admin or Shopify to make it live).
- Its variant(s) have `requiresComponents: true`. If the admin marked a component "customer
  chooses", the bundle has **its own options** (e.g. "…Color") and one variant per combination —
  the shopper picks them on the bundle's PDP.
- Price defaults to the **sum of the components** unless the admin set an override.

## The good news: selling a bundle needs (almost) no new storefront code

A bundle is just a product, so the **existing PDP + cart already handle it**:

1. **PDP** — `/products/<bundle-handle>` renders via the normal `ProductPage`. The bundle's
   options show through the existing `VariantSelector`; price/images come from Shopify. The
   `beepaws.*` marketing sections will mostly be empty for a bundle (the components have that
   content, not the bundle), so the page is hero + variants + price + whatever content you choose
   to add. The section components already return null / fall back when their metafield is empty,
   so **no empty bands render**.
2. **Cart / checkout** — add the bundle's variant id like any product (`addItem({ merchandiseId,
   … })`). Shopify expands the components at checkout; the shopper pays the bundle price and one
   product is shown. **No special cart logic needed.**
   - ⚠ Verify at checkout when possible. The store is currently password-locked with payments
     disabled, so end-to-end checkout expansion hasn't been exercised yet.

## What you may want to add (optional)

- **"What's included" on the bundle PDP.** A bundle PDP is sparse. Consider rendering the
  component list. Read it from the bundle variant's components:
  ```graphql
  product(id: …) { variants(first: 1) { edges { node {
    productVariantComponents(first: 30) { edges { node {
      quantity productVariant { title product { title handle featuredImage { url } } }
    } } }
  } } } }
  ```
  (Admin GraphQL — same client as `lib/shopify/admin-product-page.ts`.) Render "This bundle
  includes: 1× Device, 1× Consumable …".
- **Feature a bundle on a component's PDP.** To cross-sell the bundle from the device page, link
  to `/products/<bundle-handle>` (this is the *real* bundle, distinct from `BundleBuyCard`'s
  separate-items behavior). Sources for "which bundle": Shopify **Search & Discovery**
  complementary products, or a `beepaws.related_bundle` product-reference metafield on the device
  + a small card. (See `../beepaws-admin/docs/bundles-usage.md` for the merchandising options.)

## The `bundle` tag — identify / filter bundles

Every admin bundle is tagged **`bundle`**. Use it to:

- **Keep bundles out of `/collections/all`** if you don't want them mixed into the catalog. That
  route lists every published product and **can't be filtered server-side**, so exclude by tag in
  the theme/listing, e.g. skip products whose `tags` include `bundle` in
  `app/collections/all/page.tsx` (and any product grid you don't want them in).
- **Build a "Bundles" collection/section** (the inverse — only `tags: bundle`).

## TL;DR for the storefront

1. Nothing is required to *sell* an admin bundle — it's a product; the PDP + cart already work
   (verify checkout when the store allows).
2. Decide whether bundles should appear in `/collections/all` and product grids; if not, **filter
   by the `bundle` tag** (no server-side option exists).
3. Optional polish: a "What's included" block on the bundle PDP, and a "Get the bundle" cross-sell
   on component PDPs (link to the bundle product).
4. Don't confuse these with `BundleBuyCard` / `bundleTiers` — those stay as-is.

> Admin-side reference (how bundles are created, fields, constraints):
> `../beepaws-admin/docs/bundles-usage.md` and `../beepaws-admin/docs/shopify-bundles-build-brief.md`.

---

## Appendix — "What's included" component spec

A bundle PDP is sparse, so show its components. Two pieces: a fetch helper + a server component.
Adapt styling to match the existing section components (tokens like `cocoa`, `clay`, `cream`,
`line`, `brown`; `next/image`; lucide icons).

### 1. Fetch helper — `lib/shopify/bundle-contents.ts`
Reuses the existing admin GraphQL client (`adminGraphqlFetch`, same as `admin-product-page.ts`).
Reads the bundle variant's `productVariantComponents`. (Component products are the same across a
customer-choose bundle's variants, so `variants(first: 1)` is enough.)

```ts
import "server-only";
import { adminGraphqlFetch } from "./admin-graphql";

export type BundleComponent = {
  quantity: number;
  title: string;        // component product title
  handle: string;       // component product handle (for linking)
  imageUrl: string | null;
};

export async function getBundleContents(handle: string): Promise<BundleComponent[]> {
  const query = `
    query BundleContents($handle: String!) {
      productByHandle(handle: $handle) {
        tags
        variants(first: 1) {
          edges { node {
            productVariantComponents(first: 30) {
              edges { node {
                quantity
                productVariant { product { title handle featuredImage { url } } }
              } }
            }
          } }
        }
      }
    }
  `;
  const res = await adminGraphqlFetch<{
    data: {
      productByHandle: {
        tags: string[];
        variants: { edges: { node: {
          productVariantComponents: { edges: { node: {
            quantity: number;
            productVariant: { product: { title: string; handle: string; featuredImage: { url: string } | null } };
          } }[] };
        } }[] };
      } | null;
    };
  }>({ query, variables: { handle } });

  const p = res.body.data.productByHandle;
  if (!p || !p.tags.includes("bundle")) return []; // only for bundle products
  const comps = p.variants.edges[0]?.node.productVariantComponents.edges ?? [];
  return comps.map((e) => ({
    quantity: e.node.quantity,
    title: e.node.productVariant.product.title,
    handle: e.node.productVariant.product.handle,
    imageUrl: e.node.productVariant.product.featuredImage?.url ?? null,
  }));
}
```

### 2. Component — `components/product/BundleContents.tsx`
Server component (no client state needed). Renders nothing if not a bundle / no components.

```tsx
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import type { BundleComponent } from "@/lib/shopify/bundle-contents";

export function BundleContents({ items }: { items: BundleComponent[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line bg-honey-tint/50 px-4 py-3">
        <Package className="h-4 w-4 text-gold-deep" aria-hidden />
        <p className="text-sm font-bold uppercase tracking-wider text-cocoa">What&apos;s included</p>
      </div>
      <ul className="divide-y divide-line/60 px-4">
        {items.map((it) => (
          <li key={it.handle} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
              <Image src={it.imageUrl || "/product-placeholder.svg"} alt={it.title} fill className="object-cover" sizes="56px" />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${it.handle}`} className="truncate text-sm font-semibold text-cocoa hover:underline">
                {it.title}
              </Link>
            </div>
            <span className="shrink-0 text-xs font-bold text-brown">×{it.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. Wire into the PDP
In `app/products/[handle]/page.tsx` (and the §9 preview route), fetch + render only for bundles:

```tsx
const isBundle = product.tags?.includes("bundle") ?? false;
const bundleItems = isBundle ? await getBundleContents(resolvedParams.handle) : [];
// …in the hero/buy column, near the bullets or under the buy card:
{bundleItems.length > 0 && <BundleContents items={bundleItems} />}
```

Notes:
- Gate on the `bundle` tag so normal products never run the extra query.
- Component links go to each component's own PDP — handy for shoppers wanting details.
- If you also want quantity-aware pricing or stock, extend the query (`productVariant { price
  availableForSale }`), but for a fixed bundle the bundle's own price already covers it.
