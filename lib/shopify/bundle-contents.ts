import "server-only";

import { adminGraphqlFetch } from "./admin-graphql";

// Components of a Shopify product **bundle** (created via productBundleCreate /
// the Shopify Bundles app). A bundle is a product tagged `bundle` whose variant
// has `requiresComponents` + a `productVariantComponents` connection. We read
// that connection to render a "What's included" block on the bundle's PDP.
// See docs/bundles-from-admin.md.
export type BundleComponent = {
  quantity: number;
  title: string; // component product title
  handle: string; // component product handle (for linking to its PDP)
  imageUrl: string | null;
};

type BundleContentsResponse = {
  data: {
    productByHandle: {
      tags: string[];
      variants: {
        edges: {
          node: {
            productVariantComponents: {
              edges: {
                node: {
                  quantity: number;
                  productVariant: {
                    product: {
                      title: string;
                      handle: string;
                      featuredImage: { url: string } | null;
                    };
                  };
                };
              }[];
            };
          };
        }[];
      };
    } | null;
  };
};

// Component products are identical across a customer-choose bundle's variants,
// so reading the first variant's components is enough for the "what's included"
// list. Returns [] for non-bundles (or products with no components), so callers
// can render nothing without an extra tag check.
export async function getBundleContents(handle: string): Promise<BundleComponent[]> {
  const query = `
    query BundleContents($handle: String!) {
      productByHandle(handle: $handle) {
        tags
        variants(first: 1) {
          edges {
            node {
              productVariantComponents(first: 30) {
                edges {
                  node {
                    quantity
                    productVariant {
                      product {
                        title
                        handle
                        featuredImage { url }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const res = await adminGraphqlFetch<BundleContentsResponse>({
    // Cached read (CLAUDE.md: callers opt into force-cache + tags).
    // Without this the default is `no-store`, which also defeats the
    // unstable_cache wrapper in queries.ts — every render refetched.
    cache: "force-cache",
    tags: ["products"],
    query,
    variables: { handle },
  });

  const product = res.body.data.productByHandle;
  if (!product || !product.tags.includes("bundle")) return [];

  const components =
    product.variants.edges[0]?.node.productVariantComponents.edges ?? [];

  return components.map((edge) => ({
    quantity: edge.node.quantity,
    title: edge.node.productVariant.product.title,
    handle: edge.node.productVariant.product.handle,
    imageUrl: edge.node.productVariant.product.featuredImage?.url ?? null,
  }));
}
