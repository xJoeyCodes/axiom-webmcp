import { Check, Circle, LoaderCircle } from "lucide-react";

export const inspectionSteps = [
  "Reading manifest",
  "Validating capabilities",
  "Comparing registry",
  "Preparing publication",
] as const;

interface InspectionProgressProps {
  activeStep: number;
  providerDomain: string;
}

export function InspectionProgress({
  activeStep,
  providerDomain,
}: InspectionProgressProps) {
  const currentLabel = inspectionSteps[activeStep] ?? "Inspection complete";

  return (
    <section
      className="border-border mt-12 max-w-4xl border-t pt-8"
      aria-labelledby="inspection-progress-title"
      aria-live="polite"
      aria-busy={activeStep < inspectionSteps.length}
    >
      <p
        id="inspection-progress-title"
        className="text-secondary font-mono text-xs"
      >
        Inspecting {providerDomain}
      </p>
      <span className="sr-only">{currentLabel}</span>
      <ol className="mt-7 space-y-1">
        {inspectionSteps.map((step, index) => {
          const complete = index < activeStep;
          const active = index === activeStep;

          return (
            <li
              key={step}
              className="border-border grid min-h-12 grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b py-2 font-mono text-[11px]"
            >
              {complete ? (
                <Check
                  aria-hidden
                  size={13}
                  strokeWidth={1.7}
                  className="text-foreground"
                />
              ) : active ? (
                <LoaderCircle
                  aria-hidden
                  size={13}
                  strokeWidth={1.5}
                  className="text-secondary motion-safe:animate-spin"
                />
              ) : (
                <Circle
                  aria-hidden
                  size={8}
                  strokeWidth={1.4}
                  className="text-muted"
                />
              )}
              <span
                className={complete || active ? "text-secondary" : "text-muted"}
              >
                {step}
              </span>
              <span className="text-muted text-[9px] tracking-[0.08em] uppercase">
                {complete ? "Complete" : active ? "Active" : "Pending"}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
