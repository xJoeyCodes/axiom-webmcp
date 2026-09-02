import type { Metadata } from "next";

import { DiscoveryResults } from "@/components/discovery/discovery-results";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAxiomClient } from "@/lib/api/client";

export const metadata: Metadata = { title: "Discover" };

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  const parameters = await searchParams;
  const query = Array.isArray(parameters.q)
    ? parameters.q[0]
    : (parameters.q ?? "");
  const results = query ? await getAxiomClient().discover(query) : [];

  return (
    <PageContainer>
      <Section>
        <PageHeader
          eyebrow="Capability index"
          title="Discover the actionable web."
          description="Describe an outcome. Axiom ranks providers by the WebMCP capabilities they expose."
        />
        <form action="/discover" method="get" role="search" className="my-10">
          <label htmlFor="capability-query" className="sr-only">
            Search capabilities
          </label>
          <div className="flex max-w-3xl flex-col gap-3 sm:flex-row">
            <Input
              id="capability-query"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="What do you want to do?"
              autoComplete="off"
            />
            <Button type="submit" className="sm:min-w-28">
              Search
            </Button>
          </div>
        </form>
        <DiscoveryResults query={query} results={results} />
      </Section>
    </PageContainer>
  );
}
