"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import type { ManifestPublishResult } from "@/lib/types/axiom";

interface PublishSuccessProps {
  onReset: () => void;
  result: ManifestPublishResult;
}

export function PublishSuccess({ onReset, result }: PublishSuccessProps) {
  const { provider, indexing } = result;
  const searchIntent =
    provider.capabilities[0]?.name.replaceAll("_", " ") ??
    "discover capabilities";
  const fullyIndexed = indexing.failed === 0 && indexing.pending === 0;

  return (
    <section aria-labelledby="publish-success-title" className="max-w-3xl py-6">
      <p className="text-muted font-mono text-[10px] tracking-[0.14em] uppercase">
        Registry accepted · {provider.slug}
      </p>
      <h2
        id="publish-success-title"
        className="text-foreground mt-6 text-4xl font-normal tracking-[-0.045em] sm:text-5xl"
      >
        {fullyIndexed ? "Published." : "Published with warnings."}
      </h2>
      <p className="text-secondary mt-5 max-w-xl text-base leading-7">
        <span className="text-foreground font-mono text-sm">
          {provider.domain}
        </span>{" "}
        {fullyIndexed
          ? "is now indexed for capability discovery through Axiom."
          : "is registered, but one or more capabilities are still awaiting a usable semantic index."}
      </p>

      <dl className="border-border mt-8 grid grid-cols-2 border-y py-5 font-mono text-[10px] sm:grid-cols-4">
        {[
          ["Ready", indexing.ready],
          ["Unchanged", indexing.unchanged],
          ["Pending", indexing.pending],
          ["Failed", indexing.failed],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border-border border-l px-4 first:border-l-0 first:pl-0"
          >
            <dt className="text-muted uppercase">{label}</dt>
            <dd className="text-foreground mt-2 text-lg">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={`/site/${provider.slug}`} className={buttonStyles()}>
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
        label="Verify from the CLI"
        code={`axiom search "${searchIntent}"`}
      />

      <Button variant="quiet" onClick={onReset} className="mt-7">
        Publish another manifest
      </Button>
    </section>
  );
}
