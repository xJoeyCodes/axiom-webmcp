import { DiscoveryResult } from "@/components/discovery/discovery-result";
import { SearchMetadata } from "@/components/discovery/search-metadata";
import { FadeIn } from "@/components/motion/fade-in";
import type { DiscoveryResult as DiscoveryResultModel } from "@/lib/types/axiom";

interface DiscoveryResultsProps {
  query: string;
  results: DiscoveryResultModel[];
}

export function DiscoveryResults({ query, results }: DiscoveryResultsProps) {
  return (
    <section className="mt-14 sm:mt-16" aria-label="Discovery results">
      <SearchMetadata query={query} results={results} />
      <div>
        {results.map((result, index) => (
          <FadeIn key={result.provider.id} delay={Math.min(index * 0.05, 0.15)}>
            <DiscoveryResult index={index} result={result} />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
