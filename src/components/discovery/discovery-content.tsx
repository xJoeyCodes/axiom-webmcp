import { DiscoveryEmpty } from "@/components/discovery/discovery-empty";
import { DiscoveryResults } from "@/components/discovery/discovery-results";
import { getAxiomClient } from "@/lib/api/client";

interface DiscoveryContentProps {
  query: string;
}

export async function DiscoveryContent({ query }: DiscoveryContentProps) {
  if (!query) {
    return <DiscoveryEmpty />;
  }

  const results = await getAxiomClient().discover(query);

  if (results.length === 0) {
    return <DiscoveryEmpty query={query} />;
  }

  return <DiscoveryResults query={query} results={results} />;
}
