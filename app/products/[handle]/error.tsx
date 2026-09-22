"use client";

import Link from "next/link";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="mb-2 text-2xl font-bold text-[var(--color-foreground)]">
        Could not load product
      </h1>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
        {error.digest ? `Error code: ${error.digest}` : "An unexpected error occurred."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/collections/all"
          className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Back to shop
        </Link>
      </div>
    </div>
  );
}
