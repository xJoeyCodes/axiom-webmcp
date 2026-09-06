"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import {
  InspectionProgress,
  inspectionSteps,
} from "@/components/publish/inspection-progress";
import { PublishReview } from "@/components/publish/publish-review";
import { PublishSuccess } from "@/components/publish/publish-success";
import { ManifestInspectForm } from "@/components/publish/website-inspect-form";
import { Button } from "@/components/ui/button";
import { getAxiomClient } from "@/lib/api/client";
import { formatFrontendError } from "@/lib/api/errors";
import { northstarManifestJson } from "@/lib/demo/northstar-manifest";
import type {
  AxiomManifest,
  ManifestInspectionResult,
  ManifestPublishResult,
} from "@/lib/types/axiom";
import { parseManifestJson } from "@/lib/utils/manifest";

type PublishStage =
  "idle" | "inspecting" | "review" | "publishing" | "success" | "error";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function PublishForm() {
  const [stage, setStage] = useState<PublishStage>("idle");
  const [manifestText, setManifestText] = useState("");
  const [manifest, setManifest] = useState<AxiomManifest | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [inspection, setInspection] = useState<ManifestInspectionResult | null>(
    null,
  );
  const [publishResult, setPublishResult] =
    useState<ManifestPublishResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function editManifest() {
    setStage("idle");
    setInspection(null);
    setPublishResult(null);
    setErrorMessage("");
    setActiveStep(0);
  }

  function reset() {
    setManifestText("");
    setManifest(null);
    editManifest();
  }

  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseManifestJson(manifestText);
    if (!parsed.success) {
      setErrorMessage(parsed.message);
      setStage("idle");
      return;
    }

    setManifest(parsed.manifest);
    setInspection(null);
    setErrorMessage("");
    setActiveStep(0);
    setStage("inspecting");

    try {
      const inspectionPromise = getAxiomClient().inspect(parsed.manifest);
      for (let index = 0; index < inspectionSteps.length; index += 1) {
        setActiveStep(index);
        await wait(90);
      }
      const response = await inspectionPromise;
      setActiveStep(inspectionSteps.length);
      setInspection(response);
      setStage("review");
    } catch (error) {
      setErrorMessage(formatFrontendError(error));
      setStage("error");
    }
  }

  async function publish() {
    if (!manifest || stage === "publishing") return;

    setStage("publishing");
    try {
      setPublishResult(await getAxiomClient().publish(manifest));
      setStage("success");
    } catch (error) {
      setErrorMessage(formatFrontendError(error));
      setStage("error");
    }
  }

  if (stage === "success" && publishResult) {
    return <PublishSuccess result={publishResult} onReset={reset} />;
  }

  if ((stage === "review" || stage === "publishing") && inspection) {
    return (
      <PublishReview
        inspection={inspection}
        publishing={stage === "publishing"}
        onPublish={publish}
        onReset={editManifest}
      />
    );
  }

  return (
    <div>
      <ManifestInspectForm
        value={manifestText}
        error={stage === "idle" ? errorMessage : undefined}
        onLoadExample={() => {
          setManifestText(northstarManifestJson);
          setErrorMessage("");
          setStage("idle");
        }}
        onChange={(value) => {
          setManifestText(value);
          if (stage === "error") setStage("idle");
          setErrorMessage("");
        }}
        onSubmit={inspect}
        disabled={stage === "inspecting"}
      />

      {stage === "inspecting" && manifest ? (
        <InspectionProgress
          providerDomain={manifest.provider.domain}
          activeStep={activeStep}
        />
      ) : null}

      {stage === "error" ? (
        <section
          className="border-border mt-10 max-w-4xl border-t pt-8"
          aria-labelledby="inspection-error-title"
        >
          <p className="text-muted font-mono text-[10px] tracking-[0.12em] uppercase">
            Request stopped
          </p>
          <h2
            id="inspection-error-title"
            className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]"
          >
            Axiom could not prepare this publication.
          </h2>
          <p
            className="text-secondary mt-3 max-w-lg text-sm leading-6"
            role="alert"
          >
            {errorMessage}
          </p>
          <Button variant="secondary" onClick={editManifest} className="mt-6">
            Edit manifest
          </Button>
        </section>
      ) : null}
    </div>
  );
}
