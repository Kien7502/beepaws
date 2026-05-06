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
  const segments: string[] = [];
  for (const line of lines) {
    const id = variantGidToNumericId(line.merchandiseId);
    if (!id) continue;
    const qty = Number.isFinite(line.quantity) ? Math.max(1, Math.min(99, line.quantity)) : 1;
    segments.push(`${id}:${qty}`);
  }
  if (!segments.length) return null;
  const base = storeOrigin.trim().replace(/\/$/, "");
  const origin = base.startsWith("http") ? base : `https://${base}`;
  return `${origin}/cart/${segments.join(",")}`;
}
