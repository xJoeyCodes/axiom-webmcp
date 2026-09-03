import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { PublishForm } from "@/components/publish/publish-form";

export const metadata: Metadata = {
  title: "Publish",
  description: "Inspect and publish a WebMCP website to the Axiom registry.",
};

export default function PublishPage() {
  return (
    <PageContainer>
      <div className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <header className="max-w-3xl">
          <TechnicalLabel>Registry intake</TechnicalLabel>
          <h1 className="text-foreground mt-5 text-4xl font-normal tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Make your WebMCP application discoverable to agents.
          </h1>
          <p className="text-secondary mt-6 max-w-2xl text-base leading-7 sm:text-lg">
            Axiom inspects publicly exposed capabilities before adding them to
            the registry.
          </p>
        </header>

        <div className="mt-12 sm:mt-16">
          <PublishForm />
        </div>
      </div>
    </PageContainer>
  );
}
