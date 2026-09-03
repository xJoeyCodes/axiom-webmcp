"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import {
  InspectionProgress,
  inspectionSteps,
} from "@/components/publish/inspection-progress";
import { PublishReview } from "@/components/publish/publish-review";
import { PublishSuccess } from "@/components/publish/publish-success";
import { WebsiteInspectForm } from "@/components/publish/website-inspect-form";
import { Button } from "@/components/ui/button";
import { getAxiomClient } from "@/lib/api/client";
import type { InspectionResult, PublishResult } from "@/lib/types/axiom";
import { normalizeWebsiteUrl } from "@/lib/utils/url";

type PublishStage =
  "idle" | "inspecting" | "review" | "publishing" | "success" | "error";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function PublishForm() {
  const [stage, setStage] = useState<PublishStage>("idle");
  const [url, setUrl] = useState("https://northstar.example");
  const [normalizedUrl, setNormalizedUrl] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");

  function reset() {
    setStage("idle");
    setInspection(null);
    setPublishResult(null);
    setErrorMessage("");
    setActiveStep(0);
  }

  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUrl = normalizeWebsiteUrl(url);
    if (!nextUrl) return;

    setNormalizedUrl(nextUrl);
    setInspection(null);
    setErrorMessage("");
    setActiveStep(0);
    setStage("inspecting");

    try {
      const inspectionPromise = getAxiomClient().inspect(nextUrl);

      for (let index = 0; index < inspectionSteps.length; index += 1) {
        setActiveStep(index);
        await wait(120);
      }

      const response = await inspectionPromise;
      setActiveStep(inspectionSteps.length);
      await wait(80);

      if (
        response.status !== "detected" ||
        response.capabilities.length === 0
      ) {
        setErrorMessage(
          response.warnings[0] ?? "No WebMCP capabilities were detected.",
        );
        setStage("error");
        return;
      }

      setInspection(response);
      setStage("review");
    } catch {
      setErrorMessage("We couldn't inspect this website. Try again.");
      setStage("error");
    }
  }

  async function publish() {
    if (!inspection) return;

    setStage("publishing");
    try {
      const response = await getAxiomClient().publish({
        url: inspection.url,
      });

      if (response.status === "rejected") {
        setErrorMessage(response.message);
        setStage("error");
        return;
      }

      setPublishResult(response);
      setStage("success");
    } catch {
      setErrorMessage("We couldn't publish this website. Try again.");
      setStage("error");
    }
  }

  if (stage === "success" && publishResult) {
    return (
      <PublishSuccess
        result={publishResult}
        url={normalizedUrl}
        onReset={reset}
      />
    );
  }

  if ((stage === "review" || stage === "publishing") && inspection) {
    return (
      <PublishReview
        inspection={inspection}
        publishing={stage === "publishing"}
        onPublish={publish}
        onReset={reset}
      />
    );
  }

  return (
    <div>
      <WebsiteInspectForm
        value={url}
        onChange={(value) => {
          setUrl(value);
          if (stage === "error") setStage("idle");
        }}
        onSubmit={inspect}
        disabled={stage === "inspecting"}
      />

      {stage === "inspecting" ? (
        <InspectionProgress url={normalizedUrl} activeStep={activeStep} />
      ) : null}

      {stage === "error" ? (
        <section
          className="border-border mt-10 max-w-4xl border-t pt-8"
          aria-labelledby="inspection-error-title"
        >
          <p className="text-muted font-mono text-[10px] tracking-[0.12em] uppercase">
            Inspection stopped
          </p>
          <h2
            id="inspection-error-title"
            className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]"
          >
            No publishable WebMCP surface.
          </h2>
          <p
            className="text-secondary mt-3 max-w-lg text-sm leading-6"
            role="alert"
          >
            {errorMessage}
          </p>
          <Button variant="secondary" onClick={reset} className="mt-6">
            Try again
          </Button>
        </section>
      ) : null}
    </div>
  );
}
