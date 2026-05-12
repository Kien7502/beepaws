"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function ShopAllError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 md:px-6 max-w-7xl section-y">
      <div className="text-center py-20 px-4 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-2 text-[var(--color-foreground)]">
          Something went wrong
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-2 text-sm">
          {error.message || "Failed to load products."}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-8 font-mono">digest: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="primary">Try again</Button>
          <Link href="/"><Button variant="outline">Home</Button></Link>
        </div>
      </div>
    </div>
  );
}
