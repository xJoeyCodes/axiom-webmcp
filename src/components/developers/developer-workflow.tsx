import { ArrowDown, ArrowRight } from "lucide-react";

const nodes = [
  { label: "Source", value: "WebMCP website" },
  { label: "Inspect", value: "Axiom inspect" },
  { label: "Index", value: "Axiom registry" },
  { label: "Discover", value: "Agent discovery" },
] as const;

export function DeveloperWorkflow() {
  return (
    <ol className="grid gap-2 md:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1fr)] md:items-stretch">
      {nodes.map((node, index) => (
        <li key={node.label} className="contents">
          <div className="border-border-strong bg-surface min-w-0 rounded-[4px] border px-4 py-5">
            <p className="text-muted font-mono text-[9px] tracking-[0.12em] uppercase">
              {node.label}
            </p>
            <p className="text-foreground mt-5 font-mono text-[11px] break-words">
              {node.value}
            </p>
          </div>
          {index < nodes.length - 1 ? (
            <div
              aria-hidden="true"
              className="text-muted flex h-8 items-center justify-center md:h-auto"
            >
              <ArrowDown size={13} strokeWidth={1.4} className="md:hidden" />
              <ArrowRight
                size={13}
                strokeWidth={1.4}
                className="hidden md:block"
              />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
