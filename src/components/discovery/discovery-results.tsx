import { ArrowUpRight, BadgeCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { DiscoveryResult } from "@/lib/types/axiom";

interface DiscoveryResultsProps {
  query: string;
  results: DiscoveryResult[];
}

export function DiscoveryResults({ query, results }: DiscoveryResultsProps) {
  if (!query) {
    return (
      <p className="border-border text-muted border-t py-10 text-sm">
        Try “book dinner”, “find a flight”, or “buy event tickets”.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="border-border text-secondary border-t py-10 text-sm">
        No capabilities matched “{query}”.
      </p>
    );
  }

  return (
    <div className="border-border border-t">
      <p className="text-muted py-5 font-mono text-[10px] tracking-[0.12em] uppercase">
        {results.length} {results.length === 1 ? "provider" : "providers"}{" "}
        ranked
      </p>
      <div>
        {results.map((result, index) => (
          <article
            key={result.provider.id}
            className="group border-border grid gap-6 border-t py-8 first:border-t-0 lg:grid-cols-[3rem_1fr_1.1fr]"
          >
            <span className="text-muted font-mono text-[10px]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-foreground text-lg tracking-[-0.02em]">
                  {result.provider.name}
                </h2>
                {result.provider.verified ? (
                  <BadgeCheck
                    aria-label="Verified provider"
                    className="text-secondary"
                    size={15}
                  />
                ) : null}
              </div>
              <p className="text-muted mt-2 font-mono text-[11px]">
                {result.provider.domain}
              </p>
              <Link
                href={`/site/${result.provider.slug}`}
                className="text-secondary hover:text-foreground mt-5 inline-flex items-center gap-1 text-xs transition-colors"
              >
                Inspect provider <ArrowUpRight aria-hidden size={13} />
              </Link>
            </div>
            <div className="space-y-3">
              {result.matches.slice(0, 3).map((match) => (
                <div
                  key={match.capability.id}
                  className="border-border-strong flex flex-col gap-2 border-l pl-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-foreground font-mono text-xs">
                      {match.capability.name}
                    </p>
                    <p className="text-muted mt-1 text-xs leading-5">
                      {match.capability.description}
                    </p>
                  </div>
                  <Badge className="self-start sm:self-center">
                    {match.capability.metadata.category}
                  </Badge>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
