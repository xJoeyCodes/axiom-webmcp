"use client";

import { ArrowRight, FileCheck2 } from "lucide-react";

import { InspectionCapability } from "@/components/publish/inspection-capability";
import { Button } from "@/components/ui/button";
import type { ManifestInspectionResult } from "@/lib/types/axiom";

interface PublishReviewProps {
  inspection: ManifestInspectionResult;
  onPublish: () => void;
  onReset: () => void;
  publishing: boolean;
}

export function PublishReview({
  inspection,
  onPublish,
  onReset,
  publishing,
}: PublishReviewProps) {
  const { summary } = inspection;
  const hasChanges = summary.create + summary.update > 0;

  return (
    <section aria-labelledby="publish-review-title" className="max-w-5xl">
      <div className="border-border flex flex-col gap-6 border-b pb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-secondary flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase">
            <FileCheck2 aria-hidden size={13} strokeWidth={1.6} />
            Publication valid · provider {inspection.providerAction}
          </p>
          <h2
            id="publish-review-title"
            className="text-foreground mt-5 text-3xl font-normal tracking-[-0.04em] sm:text-4xl"
          >
            Review publication plan.
          </h2>
          <p className="text-secondary mt-3 text-sm leading-6">
            <span className="font-mono">
              {inspection.manifest.provider.domain}
            </span>{" "}
            contains {inspection.capabilities.length} validated WebMCP{" "}
            {inspection.capabilities.length === 1
              ? "capability"
              : "capabilities"}
            .
          </p>
        </div>
        <Button variant="quiet" onClick={onReset} disabled={publishing}>
          Edit manifest
        </Button>
      </div>

      <dl className="border-border grid grid-cols-2 border-b py-6 font-mono text-[10px] sm:grid-cols-4">
        {[
          ["Create", summary.create],
          ["Update", summary.update],
          ["Unchanged", summary.unchanged],
          ["Remove", summary.remove],
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

      <div className="border-border border-t">
        {inspection.capabilities.map((item, index) => (
          <InspectionCapability
            key={item.capability.id}
            item={item}
            index={index}
          />
        ))}
      </div>

      {inspection.warnings.length > 0 ? (
        <section
          className="border-border mt-8 border-l pl-4"
          aria-label="Publication warnings"
        >
          <p className="text-secondary font-mono text-[10px] uppercase">
            {inspection.warnings.length} validation warning
            {inspection.warnings.length === 1 ? "" : "s"}
          </p>
          <ul className="text-muted mt-3 space-y-2 text-xs leading-5">
            {inspection.warnings.map((warning) => (
              <li key={`${warning.code}-${warning.capability}`}>
                <span className="text-secondary font-mono">
                  {warning.capability}
                </span>{" "}
                · {warning.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="border-border mt-10 flex flex-col gap-5 border-t pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted max-w-xl text-xs leading-5">
          {hasChanges
            ? "Axiom will persist this plan and index semantic content through the configured backend."
            : `Everything is up to date. ${summary.unchanged} capabilities are unchanged.`}
        </p>
        <Button
          onClick={onPublish}
          disabled={publishing || !hasChanges}
          className="sm:min-w-44"
        >
          {publishing ? "Publishing" : "Publish to Axiom"}
          <ArrowRight aria-hidden size={14} strokeWidth={1.6} />
        </Button>
      </div>
    </section>
  );
}
