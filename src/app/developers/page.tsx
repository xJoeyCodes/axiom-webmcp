import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DeveloperWorkflow } from "@/components/developers/developer-workflow";
import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { buttonStyles } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Developers",
  description:
    "Build, inspect, publish, and discover WebMCP capabilities with Axiom.",
};

const developerSteps = [
  {
    number: "01",
    title: "Install",
    description:
      "Add the planned SDK to an application or use the CLI directly during development.",
    label: "Terminal / preview",
    code: "npm install @axiom-webmcp/sdk\nnpm install -g @axiom-webmcp/cli",
  },
  {
    number: "02",
    title: "Inspect",
    description:
      "Validate the public WebMCP surface before submitting it to a registry.",
    label: "Terminal / preview",
    code: "npx axiom inspect https://yourwebsite.com",
  },
  {
    number: "03",
    title: "Publish",
    description:
      "Submit validated capability metadata so agents can discover the website by intent.",
    label: "Terminal / preview",
    code: "npx axiom publish https://yourwebsite.com",
  },
  {
    number: "04",
    title: "Discover",
    description:
      "Query the shared capability index without coupling discovery to one agent framework.",
    label: "Terminal / preview",
    code: 'npx axiom search "book a restaurant"',
  },
] as const;

const sdkExample = `import { Axiom } from "@axiom-webmcp/sdk";

const axiom = new Axiom();

const results = await axiom.discover({
  intent: "book a restaurant",
});`;

const plannedCompatibility = [
  "Browser agents",
  "OpenAI agents",
  "LangChain",
  "Vercel AI SDK",
  "Custom agents",
  "Local models",
] as const;

export default function DevelopersPage() {
  return (
    <PageContainer>
      <div className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <header className="border-border border-b pb-14 sm:pb-16">
          <TechnicalLabel>Developer onboarding</TechnicalLabel>
          <h1 className="text-foreground mt-5 max-w-4xl text-4xl font-normal tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Build for the agentic web.
          </h1>
          <p className="text-secondary mt-6 max-w-2xl text-base leading-7 sm:text-lg">
            Publish your WebMCP capabilities once. Make them discoverable to
            agents through Axiom.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/publish" className={buttonStyles()}>
              Publish your site
              <ArrowRight aria-hidden size={14} strokeWidth={1.6} />
            </Link>
            <Link
              href="/docs"
              className={buttonStyles({ variant: "secondary" })}
            >
              View docs
            </Link>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: "quiet" })}
            >
              GitHub
              <ArrowUpRight aria-hidden size={14} strokeWidth={1.6} />
            </a>
          </div>
        </header>

        <section className="py-16 sm:py-20" aria-labelledby="workflow-title">
          <TechnicalLabel>Workflow</TechnicalLabel>
          <h2
            id="workflow-title"
            className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em] sm:text-3xl"
          >
            One interface from website to agent.
          </h2>
          <div className="mt-9">
            <DeveloperWorkflow />
          </div>
        </section>

        <section
          className="border-border border-t"
          aria-label="Developer commands"
        >
          {developerSteps.map((step) => (
            <article
              key={step.number}
              className="border-border grid gap-7 border-b py-12 lg:grid-cols-[3rem_minmax(0,0.75fr)_minmax(24rem,1fr)] lg:gap-10"
            >
              <p className="text-muted font-mono text-[10px]">{step.number}</p>
              <div>
                <h2 className="text-foreground text-2xl font-normal tracking-[-0.03em]">
                  {step.title}
                </h2>
                <p className="text-secondary mt-4 max-w-lg text-sm leading-6">
                  {step.description}
                </p>
              </div>
              <CodeBlock code={step.code} label={step.label} />
            </article>
          ))}
        </section>

        <section className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.75fr)_minmax(24rem,1fr)] lg:gap-16">
          <div>
            <TechnicalLabel>SDK / Concept</TechnicalLabel>
            <h2 className="text-foreground mt-4 text-3xl font-normal tracking-[-0.035em]">
              Discover from TypeScript.
            </h2>
            <p className="text-secondary mt-5 max-w-lg text-sm leading-7">
              The SDK interface shown here is a preview of the planned developer
              experience; this phase does not publish an npm package.
            </p>
          </div>
          <CodeBlock code={sdkExample} label="discover.ts / preview" />
        </section>

        <section className="border-border border-y py-14 sm:py-16">
          <TechnicalLabel>Designed for</TechnicalLabel>
          <h2 className="text-foreground mt-4 text-2xl font-normal tracking-[-0.03em]">
            Agent-neutral by default.
          </h2>
          <p className="text-secondary mt-4 max-w-2xl text-sm leading-7">
            Axiom is designed to work across agent runtimes. These names
            describe planned compatibility targets, not completed integrations.
          </p>
          <ul className="text-muted mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px]">
            {plannedCompatibility.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="pt-16 sm:pt-20">
          <TechnicalLabel>Open source</TechnicalLabel>
          <h2 className="text-foreground mt-4 text-3xl font-normal tracking-[-0.035em]">
            Open source by default.
          </h2>
          <p className="text-secondary mt-5 max-w-xl text-sm leading-7">
            Self-hostable architecture, CLI-first workflows, SDK-first access,
            agent neutrality, and an extensible registry model.
          </p>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonStyles({
              variant: "secondary",
              className: "mt-8",
            })}
          >
            View on GitHub
            <ArrowUpRight aria-hidden size={14} strokeWidth={1.6} />
          </a>
        </section>
      </div>
    </PageContainer>
  );
}
