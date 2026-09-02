import { Badge } from "@/components/ui/badge";
import type { Capability } from "@/lib/types/axiom";

interface CapabilityListProps {
  capabilities: Capability[];
}

export function CapabilityList({ capabilities }: CapabilityListProps) {
  return (
    <div className="border-border border-t">
      {capabilities.map((capability, index) => (
        <article
          key={capability.id}
          className="border-border grid gap-6 border-b py-8 lg:grid-cols-[3rem_minmax(0,1fr)_minmax(16rem,0.7fr)]"
        >
          <span className="text-muted font-mono text-[10px]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-foreground font-mono text-sm">
                {capability.name}
              </h2>
              <Badge>{capability.metadata.category}</Badge>
            </div>
            <p className="text-secondary mt-4 max-w-2xl text-sm leading-6">
              {capability.description}
            </p>
          </div>
          <dl className="space-y-3 font-mono text-[11px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Inputs</dt>
              <dd className="text-secondary text-right">
                {capability.inputs.map((input) => input.name).join(", ")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Version</dt>
              <dd className="text-secondary">{capability.metadata.version}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Confirmation</dt>
              <dd className="text-secondary">
                {capability.metadata.requiresConfirmation
                  ? "required"
                  : "not required"}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
