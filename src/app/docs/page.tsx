import type { Metadata } from "next";
import Link from "next/link";

import { DeveloperWorkflow } from "@/components/developers/developer-workflow";
import { DocsNavigation } from "@/components/docs/docs-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { buttonStyles } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Introduction and developer workflow documentation for Axiom.",
};

const manifestExample = `{
  "name": "search_inventory",
  "description": "Find available items by query",
  "inputs": {
    "query": { "type": "string" }
  }
}`;

const workflowCommands = `npx axiom inspect https://yourwebsite.com
npx axiom publish https://yourwebsite.com
npx axiom search "find available inventory"`;

const sdkExample = `const results = await axiom.discover({
  intent: "find available inventory",
});`;

export default function DocsPage() {
  return (
    <PageContainer>
      <div className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <header className="border-border border-b pb-12 sm:pb-16">
          <TechnicalLabel>Documentation / Preview</TechnicalLabel>
          <h1 className="text-foreground mt-5 text-4xl font-normal tracking-[-0.04em] sm:text-5xl">
            Axiom documentation.
          </h1>
          <p className="text-secondary mt-5 max-w-2xl text-base leading-7">
            A technical introduction to capability discovery for the agentic
            web.
          </p>
        </header>

        <div className="grid gap-10 pt-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14 lg:pt-14">
          <DocsNavigation />

          <article className="max-w-3xl min-w-0">
            <section id="introduction" className="scroll-mt-24">
              <TechnicalLabel>Introduction</TechnicalLabel>
              <h2 className="text-foreground mt-4 text-3xl font-normal tracking-[-0.035em] sm:text-4xl">
                What is Axiom?
              </h2>
              <p className="text-secondary mt-5 text-sm leading-7 sm:text-base">
                Axiom is an open discovery layer for WebMCP. It indexes the
                structured actions websites expose so agents can find a provider
                based on what they need to accomplish.
              </p>
              <p className="text-secondary mt-4 text-sm leading-7 sm:text-base">
                WebMCP makes a website actionable after an agent reaches it.
                Axiom addresses the step before that: discovering which website
                exposes the required capability.
              </p>
            </section>

            <section
              id="getting-started"
              className="border-border mt-14 scroll-mt-24 border-t pt-12"
            >
              <TechnicalLabel>Getting started</TechnicalLabel>
              <h2 className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]">
                Describe concrete capabilities.
              </h2>
              <p className="text-secondary mt-4 text-sm leading-7">
                Each capability should name one action, document its inputs and
                outputs, and expose safety metadata such as whether it changes
                external state or requires confirmation.
              </p>
              <CodeBlock
                className="mt-7"
                code={manifestExample}
                label="capability manifest / conceptual"
              />
            </section>

            <section
              id="publishing"
              className="border-border mt-14 scroll-mt-24 border-t pt-12"
            >
              <TechnicalLabel>Publishing</TechnicalLabel>
              <h2 className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]">
                Inspect before indexing.
              </h2>
              <p className="text-secondary mt-4 text-sm leading-7">
                The current frontend demonstrates inspection, schema review, and
                publishing with deterministic mock responses. It does not crawl
                websites or write to a production registry.
              </p>
              <Link
                href="/publish"
                className={buttonStyles({
                  variant: "secondary",
                  className: "mt-7",
                })}
              >
                Open publish workflow
              </Link>
            </section>

            <section
              id="discovery"
              className="border-border mt-14 scroll-mt-24 border-t pt-12"
            >
              <TechnicalLabel>Discovery</TechnicalLabel>
              <h2 className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]">
                Search by intent, not destination.
              </h2>
              <p className="text-secondary mt-4 text-sm leading-7">
                Discovery queries return providers, matched capabilities, and a
                deterministic relevance score. The current implementation uses a
                transparent local keyword model rather than embeddings or an
                LLM.
              </p>
            </section>

            <section
              id="registry"
              className="border-border mt-14 scroll-mt-24 border-t pt-12"
            >
              <TechnicalLabel>Registry</TechnicalLabel>
              <h2 className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]">
                A typed capability index.
              </h2>
              <p className="text-secondary mt-4 text-sm leading-7">
                Registry records pair provider identity and verification
                metadata with WebMCP capability schemas. The frontend consumes
                those records exclusively through the Axiom client contract.
              </p>
            </section>

            <section
              id="cli"
              className="border-border mt-14 scroll-mt-24 border-t pt-12"
            >
              <TechnicalLabel>CLI / Preview</TechnicalLabel>
              <h2 className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]">
                A minimal developer workflow.
              </h2>
              <CodeBlock
                className="mt-7"
                code={workflowCommands}
                label="Terminal / planned interface"
              />
            </section>

            <section
              id="sdk"
              className="border-border mt-14 scroll-mt-24 border-t pt-12"
            >
              <TechnicalLabel>SDK / Preview</TechnicalLabel>
              <h2 className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]">
                Typed discovery from applications.
              </h2>
              <p className="text-secondary mt-4 text-sm leading-7">
                This conceptual interface shows the intended shape. No SDK
                package is produced in this frontend phase.
              </p>
              <CodeBlock
                className="mt-7"
                code={sdkExample}
                label="TypeScript / planned interface"
              />
            </section>

            <section
              id="architecture"
              className="border-border mt-14 scroll-mt-24 border-t pt-12"
            >
              <TechnicalLabel>Architecture</TechnicalLabel>
              <h2 className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]">
                From public interface to discovery.
              </h2>
              <div className="mt-8">
                <DeveloperWorkflow />
              </div>
            </section>
          </article>
        </div>
      </div>
    </PageContainer>
  );
}
