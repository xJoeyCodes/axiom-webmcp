import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata: Metadata = { title: "Documentation" };

const manifestExample = `{
  "name": "search_inventory",
  "description": "Find available items by query",
  "inputs": {
    "query": { "type": "string" }
  }
}`;

const sections = [
  "Introduction",
  "Capabilities",
  "Schemas",
  "Publishing",
] as const;

export default function DocsPage() {
  return (
    <PageContainer>
      <Section>
        <PageHeader
          eyebrow="Documentation / Preview"
          title="A technical map of the actionable web."
          description="The documentation information architecture is ready for protocol, schema, publishing, and registry guidance."
        />
        <div className="grid gap-12 pt-12 sm:pt-16 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside>
            <nav aria-label="Documentation sections">
              <ul className="text-muted space-y-3 font-mono text-[11px]">
                {sections.map((section, index) => (
                  <li
                    key={section}
                    className={index === 0 ? "text-foreground" : undefined}
                  >
                    {String(index + 1).padStart(2, "0")} / {section}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <article className="max-w-3xl">
            <h2 className="text-foreground text-2xl tracking-[-0.03em]">
              Capability manifests
            </h2>
            <p className="text-secondary mt-4 text-sm leading-7">
              A capability should describe one concrete action with
              machine-readable inputs, an optional output schema, and metadata
              that communicates safety and confirmation requirements.
            </p>
            <div className="border-border-strong bg-elevated mt-8 overflow-hidden rounded-[5px] border">
              <div className="border-border flex items-center justify-between border-b px-3 py-2">
                <span className="text-muted font-mono text-[10px] tracking-[0.1em] uppercase">
                  manifest.json
                </span>
                <CopyButton value={manifestExample} label="Copy" />
              </div>
              <pre className="text-secondary overflow-x-auto p-5 font-mono text-xs leading-6">
                <code>{manifestExample}</code>
              </pre>
            </div>
          </article>
        </div>
      </Section>
    </PageContainer>
  );
}
