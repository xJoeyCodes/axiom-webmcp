"use client";

import { ArrowRight, BadgeCheck } from "lucide-react";

import { InspectionCapability } from "@/components/publish/inspection-capability";
import { Button } from "@/components/ui/button";
import type { InspectionResult } from "@/lib/types/axiom";

interface PublishReviewProps {
  inspection: InspectionResult;
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
  const hostname = new URL(inspection.url).hostname;

  return (
    <section aria-labelledby="publish-review-title" className="max-w-5xl">
      <div className="border-border flex flex-col gap-6 border-b pb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-secondary flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase">
            <BadgeCheck aria-hidden size={13} strokeWidth={1.6} />
            WebMCP detected
          </p>
          <h2
            id="publish-review-title"
            className="text-foreground mt-5 text-3xl font-normal tracking-[-0.04em] sm:text-4xl"
          >
            Review capabilities.
          </h2>
          <p className="text-secondary mt-3 text-sm leading-6">
            {hostname} exposes {inspection.capabilities.length} validated WebMCP{" "}
            {inspection.capabilities.length === 1
              ? "capability"
              : "capabilities"}
            .
          </p>
        </div>
        <Button variant="quiet" onClick={onReset} disabled={publishing}>
          Inspect another URL
        </Button>
      </div>

      <div className="border-border border-t">
        {inspection.capabilities.map((capability, index) => (
          <InspectionCapability
            key={capability.id}
            capability={capability}
            index={index}
          />
        ))}
      </div>

      <div className="border-border mt-10 flex flex-col gap-5 border-t pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted max-w-xl text-xs leading-5">
          Publishing uses the local mock registry in this frontend preview. No
          external request or permanent write is performed.
        </p>
        <Button
          onClick={onPublish}
          disabled={publishing}
          className="sm:min-w-44"
        >
          {publishing ? "Publishing" : "Publish to Axiom"}
          <ArrowRight aria-hidden size={14} strokeWidth={1.6} />
        </Button>
      </div>
    </section>
  );
}
