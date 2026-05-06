import Link from "next/link";
import type { Product } from "@/types/shopify";
import { BundleBuyCard } from "./BundleBuyCard";

type MaybeRecord = Record<string, unknown> | null | undefined;

type Props = {
  currentProduct: Product;
  recommendedBundleProducts?: Product[];
  normalized: {
    usage_guide: {
      parsed: unknown;
    } | null;
    specifications: {
      parsed: unknown;
    } | null;
    qna: {
      parsed: unknown;
    } | null;
    bundle_buy: {
      id: string;
      handle: string;
      title: string;
    }[];
  };
};

type QnaItem = { question: string; answer: string };

function toRecord(value: unknown): MaybeRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toQnaList(value: unknown): QnaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const rec = toRecord(item);
      if (!rec) return null;
      const question = rec.question;
      const answer = rec.answer;
      if (typeof question !== "string" || typeof answer !== "string") return null;
      return { question, answer };
    })
    .filter((item): item is QnaItem => item !== null);
}

function formatLabel(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderUsage(parsed: unknown) {
  const root = toRecord(parsed);
  if (!root) return null;
  const children = Array.isArray(root.children) ? root.children : [];
  const lines: string[] = [];

  for (const node of children) {
    const record = toRecord(node);
    if (!record) continue;
    const type = typeof record.type === "string" ? record.type : "";
    const nodeChildren = Array.isArray(record.children) ? record.children : [];
    const text = nodeChildren
      .map((child) => {
        const c = toRecord(child);
        return typeof c?.value === "string" ? c.value : "";
      })
      .join("")
      .trim();
    if (!text) continue;
    if (type === "heading") lines.push(`## ${text}`);
    else lines.push(text);
  }

  if (!lines.length) return null;
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
      {lines.map((line, index) =>
        line.startsWith("## ") ? (
          <h3
            key={`${line}-${index}`}
            className="pt-2 text-base font-semibold text-[var(--color-foreground)] md:text-lg"
          >
            {line.replace("## ", "")}
          </h3>
        ) : (
          <p key={`${line}-${index}`}>{line}</p>
        ),
      )}
    </div>
  );
}

export function ProductDetailsSections({
  currentProduct,
  normalized,
  recommendedBundleProducts = [],
}: Props) {
  const spec = toRecord(normalized.specifications?.parsed);
  const qnaList = toQnaList(normalized.qna?.parsed);
  const ingredients = toStringList(spec?.ingredients);
  const hasBundle =
    normalized.bundle_buy.length > 0 || recommendedBundleProducts.length > 0;

  if (!normalized.usage_guide && !spec && qnaList.length === 0 && !hasBundle) {
    return null;
  }

  return (
    <section className="mt-12 grid grid-cols-1 gap-4 border-t border-[var(--color-border)] pt-10 md:mt-16 md:gap-6 md:pt-12">
      {normalized.usage_guide && (
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-foreground)] md:text-2xl">
            How to use
          </h2>
          <div className="mt-4">
            {renderUsage(normalized.usage_guide.parsed) || (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add `custom.usage_guide` metafield to show guided instructions.
              </p>
            )}
          </div>
        </article>
      )}

      {spec && (
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-foreground)] md:text-2xl">
            Specifications
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-3">
            {Object.entries(spec)
              .filter(([key]) => key !== "ingredients")
              .map(([key, value]) => (
                <div
                  key={key}
                  className="grid gap-1 rounded-2xl border border-[var(--color-border)]/70 px-4 py-3 sm:grid-cols-[180px_1fr] sm:items-start"
                >
                  <dt className="text-sm font-semibold text-[var(--color-foreground)]">
                    {formatLabel(key)}
                  </dt>
                  <dd className="min-w-0 break-words text-sm text-slate-600 dark:text-slate-300">
                    {typeof value === "string" || typeof value === "number"
                      ? String(value)
                      : JSON.stringify(value)}
                  </dd>
                </div>
              ))}
          </dl>
          {ingredients.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                Ingredients
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {ingredients.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}

      {qnaList.length > 0 && (
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-foreground)] md:text-2xl">
            Q&amp;A
          </h2>
          <div className="mt-4 space-y-3">
            {qnaList.map((item) => (
              <details
                key={`${item.question}-${item.answer}`}
                className="group rounded-2xl border border-[var(--color-border)]/80 px-4 py-3"
              >
                <summary className="min-h-[44px] cursor-pointer list-none pr-4 text-sm font-semibold text-[var(--color-foreground)]">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </article>
      )}

      {hasBundle && (
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-foreground)] md:text-2xl">
            Frequently bought together
          </h2>
          {recommendedBundleProducts.length > 0 ? (
            <BundleBuyCard
              currentProduct={currentProduct}
              products={recommendedBundleProducts}
            />
          ) : null}
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {normalized.bundle_buy.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/products/${item.handle}`}
                  className="flex min-h-[44px] items-center rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-2)]"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
          {recommendedBundleProducts.length === 0 &&
          normalized.bundle_buy.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Add bundle-related product references in Shopify metafields to
              show suggestions here.
            </p>
          ) : null}
        </article>
      )}
    </section>
  );
}
