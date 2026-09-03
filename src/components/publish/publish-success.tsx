"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import type { PublishResult } from "@/lib/types/axiom";

interface PublishSuccessProps {
  onReset: () => void;
  result: PublishResult;
  url: string;
}

export function PublishSuccess({ onReset, result, url }: PublishSuccessProps) {
  const hostname = new URL(url).hostname;
  const searchIntent =
    result.provider?.capabilities[0]?.name.replaceAll("_", " ") ??
    "discover capabilities";
  const listingHref = result.provider
    ? `/site/${result.provider.slug}`
    : "/discover";

  return (
    <section aria-labelledby="publish-success-title" className="max-w-3xl py-6">
      <p className="text-muted font-mono text-[10px] tracking-[0.14em] uppercase">
        Registry accepted / {result.submissionId}
      </p>
      <h2
        id="publish-success-title"
        className="text-foreground mt-6 text-4xl font-normal tracking-[-0.045em] sm:text-5xl"
      >
        Published.
      </h2>
      <p className="text-secondary mt-5 max-w-xl text-base leading-7">
        <span className="text-foreground font-mono text-sm">{hostname}</span> is
        now discoverable through the mock Axiom registry.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={listingHref} className={buttonStyles()}>
          View listing
          <ArrowUpRight aria-hidden size={14} strokeWidth={1.6} />
        </Link>
        <Link
          href={`/discover?${new URLSearchParams({ q: searchIntent }).toString()}`}
          className={buttonStyles({ variant: "secondary" })}
        >
          Search Axiom
          <ArrowRight aria-hidden size={14} strokeWidth={1.6} />
        </Link>
      </div>

      <CodeBlock
        className="mt-12"
        label="CLI preview"
        code={'npx axiom search "search products"'}
      />

      <Button variant="quiet" onClick={onReset} className="mt-7">
        Publish another website
      </Button>
    </section>
  );
}
