"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DiscoveryErrorProps {
  onRetry: () => void;
}

export function DiscoveryError({ onRetry }: DiscoveryErrorProps) {
  return (
    <section
      className="border-border mt-14 border-t py-14 sm:mt-16 sm:py-16"
      aria-labelledby="discovery-error-title"
    >
      <p className="text-muted font-mono text-[10px] tracking-[0.13em] uppercase">
        Registry unavailable
      </p>
      <h2
        id="discovery-error-title"
        className="text-foreground mt-5 text-2xl font-normal tracking-[-0.03em]"
      >
        We couldn&apos;t search the registry.
      </h2>
      <p className="text-secondary mt-3 text-sm">Try the request again.</p>
      <Button variant="secondary" onClick={onRetry} className="mt-7">
        <RotateCcw aria-hidden size={14} strokeWidth={1.6} />
        Try again
      </Button>
    </section>
  );
}
