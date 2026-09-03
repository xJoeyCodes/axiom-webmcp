"use client";

import { RotateCcw } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <PageContainer>
      <section
        className="flex min-h-[60vh] flex-col justify-center py-20"
        aria-labelledby="application-error-title"
        role="alert"
      >
        <p className="text-muted font-mono text-[10px] tracking-[0.14em] uppercase">
          Request interrupted
        </p>
        <h1
          id="application-error-title"
          className="text-foreground mt-6 text-4xl font-normal tracking-[-0.04em] sm:text-5xl"
        >
          Something went wrong.
        </h1>
        <p className="text-secondary mt-5 max-w-lg text-sm leading-6 sm:text-base sm:leading-7">
          Axiom couldn&apos;t complete this request. No changes were made.
        </p>
        <Button variant="secondary" onClick={reset} className="mt-8 w-fit">
          <RotateCcw aria-hidden size={14} strokeWidth={1.6} />
          Try again
        </Button>
      </section>
    </PageContainer>
  );
}
