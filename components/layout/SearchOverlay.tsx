"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 text-[var(--color-foreground)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden md:inline-flex"
        aria-label="Search products"
        aria-expanded={open}
      >
        <Search size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 md:pt-32 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3 mb-3">
              <Search className="h-5 w-5 text-[var(--color-primary)] shrink-0" />
              <input
                ref={inputRef}
                type="search"
                placeholder="Search products…"
                className="flex-1 bg-transparent text-[var(--color-foreground)] placeholder-slate-400 outline-none text-base min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 px-1">
              Product search from the catalog is not wired yet — browse via Shop All and collections for now.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
