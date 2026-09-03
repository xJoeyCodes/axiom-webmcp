import type { DiscoveryResult } from "@/lib/types/axiom";

interface SearchMetadataProps {
  query: string;
  results: DiscoveryResult[];
}

export function SearchMetadata({ query, results }: SearchMetadataProps) {
  const capabilityCount = results.reduce(
    (total, result) => total + result.matches.length,
    0,
  );

  return (
    <div className="border-border flex flex-col gap-2 border-b py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-secondary text-sm" aria-live="polite">
        <span className="text-foreground">{results.length}</span>{" "}
        {results.length === 1 ? "provider" : "providers"}
        <span className="text-muted mx-2" aria-hidden="true">
          ·
        </span>
        <span className="text-foreground">{capabilityCount}</span> matched{" "}
        {capabilityCount === 1 ? "capability" : "capabilities"}
      </p>
      <p className="text-muted max-w-full truncate font-mono text-[10px] sm:max-w-xs">
        query: {query}
      </p>
    </div>
  );
}
