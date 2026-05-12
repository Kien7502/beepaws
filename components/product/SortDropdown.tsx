"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { SORT_OPTIONS, type SortValue } from "@/lib/sort-options";

export { SORT_OPTIONS } from "@/lib/sort-options";
export type { SortValue } from "@/lib/sort-options";

export default function SortDropdown({ current }: { current: SortValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: SortValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "featured") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={15} className="shrink-0 text-slate-400" aria-hidden />
      <label htmlFor="sort-select" className="sr-only">Sort products</label>
      <select
        id="sort-select"
        value={current}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-foreground)] shadow-sm transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
