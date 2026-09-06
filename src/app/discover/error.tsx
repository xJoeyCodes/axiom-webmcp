"use client";

import { DiscoveryError } from "@/components/discovery/discovery-error";
import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";

export default function DiscoverError({ reset }: { reset: () => void }) {
  return (
    <PageContainer>
      <main className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <TechnicalLabel>Capability index</TechnicalLabel>
        <h1 className="text-foreground mt-5 text-4xl font-normal tracking-[-0.04em] sm:text-5xl lg:text-6xl">
          Discover
        </h1>
        <p className="text-secondary mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          Axiom discovery is unavailable. This is an API failure, not an empty
          result set.
        </p>
        <div className="max-w-4xl">
          <DiscoveryError onRetry={reset} />
        </div>
      </main>
    </PageContainer>
  );
}
