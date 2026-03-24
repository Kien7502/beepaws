import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

type Props = {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
};

export function SimpleArticle({ title, description, breadcrumbs, children }: Props) {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-3xl">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-foreground)] mb-4 tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">{description}</p>
      )}
      <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
