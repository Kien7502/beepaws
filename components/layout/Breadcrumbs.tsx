import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-2 min-w-0">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="font-medium hover:text-[var(--color-primary)] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-semibold text-[var(--color-foreground)] line-clamp-2">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
