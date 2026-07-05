import Link from "next/link";

// Page-bottom section: shows "How to use", "Q&A", "More from this collection".
// Specifications + Description live in the DescriptionAccordion near the buy box (not here).
// usage_guide / qna come from `custom.*` metafields (legacy namespace, not beepaws.*).

type MaybeRecord = Record<string, unknown> | null | undefined;

type Props = {
  normalized: {
    usage_guide: { parsed: unknown } | null;
    qna: { parsed: unknown } | null;
    bundle_buy: { id: string; handle: string; title: string }[];
  };
};

type QnaItem = { question: string; answer: string };

function toRecord(value: unknown): MaybeRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
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
    <div className="space-y-3 text-sm leading-relaxed text-[var(--color-text)]/80 md:text-base">
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
  normalized,
}: Props) {
  const qnaList = toQnaList(normalized.qna?.parsed);
  const hasBundle = normalized.bundle_buy.length > 0;

  if (!normalized.usage_guide && qnaList.length === 0 && !hasBundle) {
    return null;
  }

  return (
    <section className="ds-reveal-in border-t border-line bg-sand py-14 md:py-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-4 md:gap-6">
      {normalized.usage_guide && (
        <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-7">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-foreground)] md:text-2xl">
            How to use
          </h2>
          <div className="mt-4">
            {renderUsage(normalized.usage_guide.parsed) || (
              <p className="text-sm text-[var(--color-accent)]/70">
                Add `custom.usage_guide` metafield to show guided instructions.
              </p>
            )}
          </div>
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
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]/80">
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
            More from this collection
          </h2>
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
        </article>
      )}

        </div>
      </div>
    </section>
  );
}
