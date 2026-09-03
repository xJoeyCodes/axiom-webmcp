import { ArrowRight } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Reveal } from "@/components/motion/reveal";

const flowNodes = [
  {
    label: "User intent",
    value: '"Book dinner"',
    detail: "Natural language",
    emphasized: false,
  },
  {
    label: "Axiom",
    value: "Capability match",
    detail: "Discovery index",
    emphasized: true,
  },
  {
    label: "Provider",
    value: "restaurant.example",
    detail: "WebMCP enabled",
    emphasized: false,
  },
  {
    label: "WebMCP",
    value: "make_reservation()",
    detail: "Invokable action",
    emphasized: false,
  },
] as const;

export function DiscoveryFlow() {
  return (
    <section
      aria-labelledby="discovery-flow-title"
      className="border-border bg-elevated/45 border-y py-24 sm:py-28 lg:py-32"
    >
      <PageContainer>
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-muted font-mono text-[10px] tracking-[0.15em] uppercase">
              Intent to action
            </p>
            <h2
              id="discovery-flow-title"
              className="text-foreground mt-5 text-3xl font-normal tracking-[-0.04em] sm:text-4xl"
            >
              A path through the actionable web.
            </h2>
          </div>

          <ol className="mt-12 grid items-stretch gap-3 md:mt-16 md:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1.15fr)] md:gap-2">
            {flowNodes.map((node, index) => (
              <li key={node.label} className="contents">
                <div
                  className={`group hover:bg-surface-hover min-w-0 rounded-[5px] border p-5 transition-[border-color,background-color] duration-200 sm:p-6 ${
                    node.emphasized
                      ? "border-white/25 bg-white/[0.035]"
                      : "border-border-strong bg-background/35"
                  }`}
                >
                  <p className="text-muted font-mono text-[9px] tracking-[0.13em] uppercase">
                    {node.label}
                  </p>
                  <p className="text-foreground mt-7 font-mono text-xs leading-5 break-words sm:text-[13px]">
                    {node.value}
                  </p>
                  <p className="text-muted mt-2 text-[11px]">{node.detail}</p>
                </div>
                {index < flowNodes.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className="flex h-8 items-center justify-center text-white/20 md:h-auto"
                  >
                    <span className="h-full w-px bg-white/10 md:h-px md:w-full" />
                    <ArrowRight
                      size={13}
                      strokeWidth={1.4}
                      className="bg-elevated absolute rotate-90 md:rotate-0"
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </Reveal>
      </PageContainer>
    </section>
  );
}
