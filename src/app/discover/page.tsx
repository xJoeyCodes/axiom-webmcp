import type { Metadata } from "next";
import { Suspense } from "react";

import { DiscoveryContent } from "@/components/discovery/discovery-content";
import { DiscoveryLoading } from "@/components/discovery/discovery-loading";
import { DiscoverySearch } from "@/components/discovery/discovery-search";
import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Search WebMCP-enabled websites by the capabilities they expose.",
};

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  const parameters = await searchParams;
  const rawQuery = Array.isArray(parameters.q)
    ? parameters.q[0]
    : (parameters.q ?? "");
  const query = rawQuery.trim();

  return (
    <PageContainer>
      <div className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <header className="max-w-3xl">
          <TechnicalLabel>Capability index</TechnicalLabel>
          <h1 className="text-foreground mt-5 text-4xl font-normal tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Discover
          </h1>
          <p className="text-secondary mt-5 max-w-2xl text-base leading-7 sm:text-lg">
            Search the agentic web by the capabilities websites expose.
          </p>
        </header>

        <div className="mt-10 max-w-4xl sm:mt-12">
          <DiscoverySearch key={query} initialQuery={query} />
        </div>

        <Suspense key={query} fallback={<DiscoveryLoading />}>
          <DiscoveryContent query={query} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
