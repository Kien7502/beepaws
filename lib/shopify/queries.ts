import { shopifyFetch } from "./index";
import { Collection, Product } from "@/types/shopify";
import { isShopifyConfigured, useMockShopData } from "@/lib/shopify-config";
import {
  getMockCollections,
  getMockProduct,
  getMockProductsFiltered,
} from "@/lib/mock-data";

function preferMock(): boolean {
  return !isShopifyConfigured() || useMockShopData();
}

export async function getCollections(): Promise<Collection[]> {
  if (preferMock()) {
    return getMockCollections();
  }

  const query = `
    query getCollections {
      collections(first: 100, sortKey: TITLE) {
        edges {
          node {
            id
            title
            handle
            description
            seo {
              description
              title
            }
          }
        }
      }
    }
  `;

  try {
    const res = await shopifyFetch<{
      data: { collections: { edges: { node: Collection }[] } };
    }>({
      query,
      tags: ["collections"],
    });
    return res.body.data.collections.edges.map((edge) => edge.node);
  } catch {
    return getMockCollections();
  }
}

export async function getProducts({
  collectionHandle,
  query,
  reverse,
  sortKey,
}: {
  collectionHandle?: string;
  query?: string;
  reverse?: boolean;
  sortKey?: string;
} = {}): Promise<Product[]> {
  if (preferMock()) {
    return getMockProductsFiltered({ collectionHandle });
  }

  let gqlQuery = `
    query getProducts($first: Int!, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
      products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            ...productFragment
          }
        }
      }
    }
  `;

  if (collectionHandle) {
    gqlQuery = `
      query getCollectionProducts($handle: String!, $first: Int!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
        collection(handle: $handle) {
          products(first: $first, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                ...productFragment
              }
            }
          }
        }
      }
    `;
  }

  // Fragment to keep responses consistent
  const fragment = `
    fragment productFragment on Product {
      id
      handle
      title
      description
      descriptionHtml
      availableForSale
      priceRange {
        maxVariantPrice { amount currencyCode }
        minVariantPrice { amount currencyCode }
      }
      variants(first: 250) {
        edges {
          node {
            id
            title
            availableForSale
            selectedOptions { name value }
            price { amount currencyCode }
          }
        }
      }
      images(first: 20) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      seo { description title }
    }
  `;

  const finalQuery = fragment + gqlQuery;

  try {
    const res = await shopifyFetch<any>({
      query: finalQuery,
      tags: ["products"],
      variables: {
        first: 100,
        handle: collectionHandle,
        query,
        reverse,
        sortKey:
          sortKey || (collectionHandle ? "COLLECTION_DEFAULT" : "BEST_SELLING"),
      },
    });

    if (collectionHandle) {
      return (
        res.body.data.collection?.products?.edges.map(
          (edge: any) => edge.node,
        ) || []
      );
    }

    return res.body.data.products.edges.map((edge: any) => edge.node);
  } catch (error) {
    console.error("Failed to fetch products", error);
    return getMockProductsFiltered({ collectionHandle });
  }
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  if (preferMock()) {
    return getMockProduct(handle);
  }

  const query = `
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        description
        descriptionHtml
        availableForSale
        priceRange {
          maxVariantPrice { amount currencyCode }
          minVariantPrice { amount currencyCode }
        }
        variants(first: 250) {
          edges {
            node {
              id
              title
              availableForSale
              selectedOptions { name value }
              price { amount currencyCode }
            }
          }
        }
        images(first: 20) {
          edges {
            node {
              url
              altText
              width
              height
            }
          }
        }
        seo { description title }
      }
    }
  `;

  try {
    const res = await shopifyFetch<{ data: { product: Product | null } }>({
      query,
      tags: ["products"],
      variables: {
        handle,
      },
    });

    return res.body.data.product ?? undefined;
  } catch {
    return getMockProduct(handle);
  }
}
