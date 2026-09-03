import { ArrowUpRight, BadgeCheck } from "lucide-react";
import Link from "next/link";

import type { DiscoveryResult as DiscoveryResultModel } from "@/lib/types/axiom";

interface DiscoveryResultProps {
  index: number;
  result: DiscoveryResultModel;
}

export function DiscoveryResult({ index, result }: DiscoveryResultProps) {
  const { provider } = result;
  const matchedCapabilityIds = new Set(
    result.matches.map((match) => match.capability.id),
  );

  return (
    <article className="border-border border-b">
      <Link
        href={`/site/${provider.slug}`}
        aria-label={`View ${provider.name} provider details, ${result.score}% match`}
        className="group hover:bg-surface focus-visible:bg-surface -mx-3 grid min-w-0 gap-6 px-3 py-8 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-inset sm:-mx-5 sm:px-5 sm:py-10 lg:grid-cols-[2.5rem_minmax(0,1.05fr)_minmax(0,1fr)_5rem] lg:gap-8"
      >
        <span className="text-muted hidden pt-1 font-mono text-[10px] lg:block">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4 lg:block">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-foreground text-xl font-normal tracking-[-0.025em] sm:text-2xl">
                  {provider.name}
                </h2>
                {provider.verified ? (
                  <BadgeCheck
                    aria-label="Verified provider"
                    className="text-secondary shrink-0"
                    size={16}
                    strokeWidth={1.6}
                  />
                ) : null}
              </div>
              <p className="text-muted mt-2 font-mono text-[11px] break-all">
                {provider.domain}
              </p>
            </div>
            <div className="shrink-0 text-right lg:hidden">
              <p className="text-foreground font-mono text-lg">
                {result.score}%
              </p>
              <p className="text-muted mt-1 font-mono text-[9px] uppercase">
                match
              </p>
            </div>
          </div>

          <p className="text-secondary mt-5 max-w-xl text-sm leading-6">
            {provider.description}
          </p>
          <p className="text-muted mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9px] tracking-[0.08em] uppercase">
            {provider.verified ? "Verified" : provider.verificationStatus}
            <span aria-hidden="true">·</span>
            WebMCP
            <span aria-hidden="true">·</span>
            {provider.capabilities.length}{" "}
            {provider.capabilities.length === 1 ? "capability" : "capabilities"}
          </p>
        </div>

        <div className="min-w-0 border-white/10 lg:border-l lg:pl-7">
          <p className="text-muted font-mono text-[9px] tracking-[0.12em] uppercase">
            Exposed capabilities
          </p>
          <ul className="mt-4 space-y-2.5">
            {provider.capabilities.map((capability) => {
              const isMatched = matchedCapabilityIds.has(capability.id);

              return (
                <li
                  key={capability.id}
                  className={`flex min-w-0 items-center gap-2 font-mono text-[11px] sm:text-xs ${
                    isMatched ? "text-foreground" : "text-muted"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-1 shrink-0 rounded-full ${
                      isMatched ? "bg-white/70" : "bg-white/15"
                    }`}
                  />
                  <span className="min-w-0 break-all">{capability.name}</span>
                  {isMatched ? <span className="sr-only">Matched</span> : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden text-right lg:block">
          <p className="text-foreground font-mono text-lg">{result.score}%</p>
          <p className="text-muted mt-1 font-mono text-[9px] uppercase">
            match
          </p>
          <ArrowUpRight
            aria-hidden
            size={16}
            strokeWidth={1.5}
            className="text-muted group-hover:text-foreground mt-8 ml-auto transition-colors duration-200"
          />
        </div>
      </Link>
    </article>
  );
}
