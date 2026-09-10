"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import {
  InspectionProgress,
  manifestInspectionSteps,
  websiteInspectionSteps,
} from "@/components/publish/inspection-progress";
import { PublishReview } from "@/components/publish/publish-review";
import { PublishSuccess } from "@/components/publish/publish-success";
import {
  ManifestInspectForm,
  WebsiteInspectForm,
} from "@/components/publish/website-inspect-form";
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
import { normalizeWebsiteUrl } from "@/lib/utils/url";
import {
  inspectWebsiteWebMcp,
  WebsiteInspectionError,
} from "@/lib/webmcp/website-inspector";

type PublishStage =
  "idle" | "inspecting" | "review" | "publishing" | "success" | "error";
type InspectionSource = "website" | "manifest";

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

interface PublishFormProps {
  initialUrl?: string;
}

export function PublishForm({ initialUrl = "" }: PublishFormProps) {
  const [source, setSource] = useState<InspectionSource>("website");
  const [stage, setStage] = useState<PublishStage>("idle");
  const [websiteUrl, setWebsiteUrl] = useState(initialUrl);
  const [manifestText, setManifestText] = useState("");
  const [manifest, setManifest] = useState<AxiomManifest | null>(null);
  const [progressDomain, setProgressDomain] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [inspection, setInspection] = useState<ManifestInspectionResult | null>(
    null,
  );
  const [publishResult, setPublishResult] =
    useState<ManifestPublishResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function editInput() {
    setStage("idle");
    setInspection(null);
    setPublishResult(null);
    setErrorMessage("");
    setActiveStep(0);
  }

  function reset() {
    setWebsiteUrl("");
    setManifestText("");
    setManifest(null);
    setSource("website");
    editInput();
  }

  function changeSource(next: InspectionSource) {
    if (stage === "inspecting") return;
    setSource(next);
    editInput();
  }

  async function inspectWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = websiteUrl.trim().startsWith("/")
      ? new URL(websiteUrl, window.location.origin).toString()
      : normalizeWebsiteUrl(websiteUrl);
    if (!normalized) {
      setErrorMessage("Enter a valid HTTP or HTTPS website URL.");
      return;
    }

    setErrorMessage("");
    setInspection(null);
    setProgressDomain(new URL(normalized).hostname);
    setActiveStep(0);
    setStage("inspecting");

    try {
      const discoveredManifest = await inspectWebsiteWebMcp(normalized, {
        onPhaseChange: (phase) => setActiveStep(phase === "opening" ? 0 : 1),
      });
      setManifest(discoveredManifest);
      setManifestText(JSON.stringify(discoveredManifest, null, 2));
      setActiveStep(2);
      const responsePromise = getAxiomClient().inspect(discoveredManifest);
      await wait(100);
      setActiveStep(3);
      const response = await responsePromise;
      setActiveStep(websiteInspectionSteps.length);
      setInspection(response);
      setStage("review");
    } catch (error) {
      setErrorMessage(
        error instanceof WebsiteInspectionError
          ? error.message
          : formatFrontendError(error),
      );
      setStage("error");
    }
  }

  async function inspectManifest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseManifestJson(manifestText);
    if (!parsed.success) {
      setErrorMessage(parsed.message);
      setStage("idle");
      return;
    }

    setManifest(parsed.manifest);
    setProgressDomain(parsed.manifest.provider.domain);
    setInspection(null);
    setErrorMessage("");
    setActiveStep(0);
    setStage("inspecting");

    try {
      await wait(80);
      setActiveStep(1);
      const responsePromise = getAxiomClient().inspect(parsed.manifest);
      await wait(80);
      setActiveStep(2);
      await wait(80);
      setActiveStep(3);
      const response = await responsePromise;
      setActiveStep(manifestInspectionSteps.length);
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
        onReset={editInput}
      />
    );
  }

  const steps =
    source === "website" ? websiteInspectionSteps : manifestInspectionSteps;

  return (
    <div>
      <div
        className="border-border mb-9 flex w-fit border-b"
        aria-label="Inspection source"
      >
        <button
          type="button"
          aria-pressed={source === "website"}
          onClick={() => changeSource("website")}
          className={`min-h-11 border-b px-1 pr-6 text-sm transition-colors duration-200 ${
            source === "website"
              ? "border-foreground text-foreground"
              : "text-muted hover:text-secondary border-transparent"
          }`}
        >
          Website URL
        </button>
        <button
          type="button"
          aria-pressed={source === "manifest"}
          onClick={() => changeSource("manifest")}
          className={`min-h-11 border-b px-6 text-sm transition-colors duration-200 ${
            source === "manifest"
              ? "border-foreground text-foreground"
              : "text-muted hover:text-secondary border-transparent"
          }`}
        >
          Manifest JSON
        </button>
      </div>

      {source === "website" ? (
        <WebsiteInspectForm
          value={websiteUrl}
          error={stage === "idle" ? errorMessage : undefined}
          onChange={(value) => {
            setWebsiteUrl(value);
            setErrorMessage("");
          }}
          onSubmit={inspectWebsite}
          disabled={stage === "inspecting"}
        />
      ) : (
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
            setErrorMessage("");
          }}
          onSubmit={inspectManifest}
          disabled={stage === "inspecting"}
        />
      )}

      {stage === "inspecting" ? (
        <InspectionProgress
          providerDomain={progressDomain}
          activeStep={activeStep}
          steps={steps}
        />
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
            Axiom could not complete this publication.
          </h2>
          <p
            className="text-secondary mt-3 max-w-2xl text-sm leading-6"
            role="alert"
          >
            {errorMessage}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={editInput}>
              Try again
            </Button>
            {source === "website" ? (
              <Button variant="quiet" onClick={() => changeSource("manifest")}>
                Use a manifest instead
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
