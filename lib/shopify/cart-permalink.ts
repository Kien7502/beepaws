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

export function buildStorefrontCartPermalinkFromLines(
  storeOrigin: string | undefined,
  lines: { merchandiseId: string; quantity: number }[],
): string | null {
  if (!storeOrigin?.trim() || !lines.length) return null;
  // Merge duplicate variants: permalinks can't express selling plans, so a
  // one-time + subscribed pair of the same variant collapses to one segment.
  // Shopify's cart page hard-errors on duplicate ids ("you can't add two
  // separate items with the same ID").
  const qtyById = new Map<string, number>();
  for (const line of lines) {
    const id = variantGidToNumericId(line.merchandiseId);
    if (!id) continue;
    const qty = Number.isFinite(line.quantity) ? Math.max(1, Math.min(99, line.quantity)) : 1;
    qtyById.set(id, Math.min(99, (qtyById.get(id) ?? 0) + qty));
  }
  if (qtyById.size === 0) return null;
  const segments = Array.from(qtyById, ([id, qty]) => `${id}:${qty}`);
  const base = storeOrigin.trim().replace(/\/$/, "");
  const origin = base.startsWith("http") ? base : `https://${base}`;
  return `${origin}/cart/${segments.join(",")}`;
}
