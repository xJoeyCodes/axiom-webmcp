import { CopyButton } from "@/components/ui/copy-button";
import type { Capability } from "@/lib/types/axiom";

import { SchemaField } from "./schema-field";

interface SchemaViewerProps {
  capability: Capability;
}

export function SchemaViewer({ capability }: SchemaViewerProps) {
  const behavior = capability.metadata.sideEffecting
    ? "Changes external state"
    : "Read only";
  const confirmation = capability.metadata.requiresConfirmation
    ? "User confirmation required"
    : "No confirmation required";

  return (
    <div className="border-border bg-elevated/35 border-y px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <p className="text-muted font-mono text-[9px] tracking-[0.13em] uppercase">
          WebMCP schema
        </p>
        <CopyButton value={capability.name} label="Copy name" />
      </div>

      <div className="grid gap-10 pt-7 xl:grid-cols-2 xl:gap-12">
        <section aria-labelledby={`${capability.id}-input-title`}>
          <div className="flex items-center justify-between gap-4">
            <h4
              id={`${capability.id}-input-title`}
              className="text-secondary font-mono text-[10px] tracking-[0.13em] uppercase"
            >
              Input
            </h4>
            <span className="text-muted font-mono text-[9px]">
              {capability.inputs.length} fields
            </span>
          </div>
          {capability.inputs.length > 0 ? (
            <ul className="border-border mt-4 border-t">
              {capability.inputs.map((input) => (
                <SchemaField
                  key={input.name}
                  name={input.name}
                  description={input.description}
                  required={input.required}
                  schema={input.schema}
                />
              ))}
            </ul>
          ) : (
            <p className="text-muted mt-4 text-xs">
              No structured input required.
            </p>
          )}
        </section>

        <section aria-labelledby={`${capability.id}-output-title`}>
          <h4
            id={`${capability.id}-output-title`}
            className="text-secondary font-mono text-[10px] tracking-[0.13em] uppercase"
          >
            Output
          </h4>
          {capability.output ? (
            <ul className="border-border mt-4 border-t">
              <SchemaField
                name={capability.output.schema.title ?? "response"}
                description={capability.output.description}
                required
                schema={capability.output.schema}
              />
            </ul>
          ) : (
            <p className="text-muted mt-4 text-xs">
              No output schema declared.
            </p>
          )}
        </section>
      </div>

      <section
        aria-labelledby={`${capability.id}-metadata-title`}
        className="border-border mt-10 border-t pt-7"
      >
        <h4
          id={`${capability.id}-metadata-title`}
          className="text-secondary font-mono text-[10px] tracking-[0.13em] uppercase"
        >
          Metadata
        </h4>
        <dl className="mt-5 grid gap-x-8 gap-y-5 font-mono text-[10px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-muted">Behavior</dt>
            <dd className="text-foreground mt-1.5">{behavior}</dd>
          </div>
          <div>
            <dt className="text-muted">Confirmation</dt>
            <dd className="text-secondary mt-1.5">{confirmation}</dd>
          </div>
          <div>
            <dt className="text-muted">Transport</dt>
            <dd className="text-secondary mt-1.5 uppercase">
              {capability.metadata.transport}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Version</dt>
            <dd className="text-secondary mt-1.5">
              {capability.metadata.version}
            </dd>
          </div>
        </dl>

        {capability.metadata.sideEffecting ? (
          <p className="border-border-strong text-secondary mt-7 border-l pl-4 text-xs leading-5">
            Action changes external state
            {capability.metadata.requiresConfirmation
              ? " and requires user confirmation."
              : "."}
          </p>
        ) : null}
      </section>
    </div>
  );
}
