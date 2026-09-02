import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = { title: "Developers" };

const steps = [
  {
    title: "Describe",
    description:
      "Expose clear capability names, inputs, outputs, and safety metadata.",
  },
  {
    title: "Verify",
    description:
      "Let Axiom inspect the public WebMCP surface and validate its shape.",
  },
  {
    title: "Discover",
    description:
      "Make those capabilities queryable by agents through the shared index.",
  },
] as const;

export default function DevelopersPage() {
  return (
    <PageContainer>
      <Section>
        <PageHeader
          eyebrow="Developer onboarding"
          title="Make your website agent-discoverable."
          description="Axiom turns a well-described WebMCP surface into an indexed set of actions that agents can find and evaluate."
        />
        <ol className="border-border mt-12 border-t sm:mt-16">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="border-border grid gap-4 border-b py-8 sm:grid-cols-[4rem_12rem_1fr] sm:items-start"
            >
              <TechnicalLabel>
                {String(index + 1).padStart(2, "0")}
              </TechnicalLabel>
              <h2 className="text-foreground text-lg tracking-[-0.02em]">
                {step.title}
              </h2>
              <p className="text-secondary max-w-xl text-sm leading-6">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href="/docs"
          className={buttonStyles({ variant: "secondary", className: "mt-10" })}
        >
          Read the documentation <ArrowRight aria-hidden size={14} />
        </Link>
      </Section>
    </PageContainer>
  );
}
