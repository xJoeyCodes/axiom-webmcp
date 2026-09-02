import type { ReactNode } from "react";

import { TechnicalLabel } from "@/components/layout/technical-label";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="border-border grid gap-8 border-b pb-12 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="max-w-3xl">
        {eyebrow ? <TechnicalLabel>{eyebrow}</TechnicalLabel> : null}
        <h1 className="text-foreground mt-5 text-4xl font-normal tracking-[-0.04em] sm:text-5xl">
          {title}
        </h1>
        <p className="text-secondary mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
