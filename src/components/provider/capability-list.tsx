import { CapabilityItem } from "@/components/provider/capability-item";
import { TechnicalLabel } from "@/components/layout/technical-label";
import type { Capability } from "@/lib/types/axiom";

interface CapabilityListProps {
  capabilities: Capability[];
}

export function CapabilityList({ capabilities }: CapabilityListProps) {
  return (
    <section aria-labelledby="capabilities-title" className="pt-16 sm:pt-20">
      <div className="flex items-end justify-between gap-6 pb-7 sm:pb-8">
        <div>
          <TechnicalLabel>Exposed interface</TechnicalLabel>
          <h2
            id="capabilities-title"
            className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em] sm:text-3xl"
          >
            Capabilities
          </h2>
        </div>
        <p className="text-muted font-mono text-sm">
          {String(capabilities.length).padStart(2, "0")}
        </p>
      </div>

      <div className="border-border border-t">
        {capabilities.map((capability, index) => (
          <CapabilityItem
            key={capability.id}
            capability={capability}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
