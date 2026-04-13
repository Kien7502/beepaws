/**
 * Online store cart permalinks: https://{shop}/cart/{variant_id}:{quantity}
 * Storefront variant GIDs must end with a numeric id (invalid GIDs return null).
 */
export function variantGidToNumericId(variantGid: string): string | null {
  const m = /^gid:\/\/shopify\/ProductVariant\/(\d+)$/.exec(variantGid.trim());
  return m?.[1] ?? null;
}

export function buildStorefrontCartPermalink(
  storeOrigin: string | undefined,
  variantGid: string,
  quantity = 1,
): string | null {
  if (!storeOrigin?.trim()) return null;
  const id = variantGidToNumericId(variantGid);
  if (!id) return null;
  const base = storeOrigin.trim().replace(/\/$/, "");
  const origin = base.startsWith("http") ? base : `https://${base}`;
  return `${origin}/cart/${id}:${quantity}`;
}
