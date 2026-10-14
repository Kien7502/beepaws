/**
 * Keeps an em dash on the line with the word before it: " —" becomes a no-break
 * space + "—" in every string of authored content, so a wrapped line can end
 * with a dash but never start with one (owner, 2026-10-14 — the buy box's
 * "First time?" note wrapped as "— only when it touches a tooth"; the same idea
 * as keepHyphenated in lib/inline-format.tsx).
 *
 * Applied where content ENTERS the storefront — the product's beepaws.*
 * metafields (published and the admin's draft), listicles and the homepage — so
 * every component gets it without changing how it renders. Plain JSON in, the
 * same shape out; non-strings pass through untouched.
 */
export function bindDashes<T>(value: T): T {
  if (typeof value === "string") return value.replace(/ +—/g, " —") as T;
  if (Array.isArray(value)) return value.map((v) => bindDashes(v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, bindDashes(v)])) as T;
  }
  return value;
}
