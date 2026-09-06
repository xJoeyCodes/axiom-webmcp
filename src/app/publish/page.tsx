import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { PublishForm } from "@/components/publish/publish-form";

export const metadata: Metadata = {
  title: "Publish",
  description: "Validate and publish WebMCP capability contracts to Axiom.",
};

export default function PublishPage() {
  return (
    <PageContainer>
      <div className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <header className="max-w-3xl">
          <TechnicalLabel>Registry intake</TechnicalLabel>
          <h1 className="text-foreground mt-5 text-4xl font-normal tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Make your WebMCP capabilities discoverable.
          </h1>
          <p className="text-secondary mt-6 max-w-2xl text-base leading-7 sm:text-lg">
            Paste an Axiom manifest to validate its capability contracts,
            compare them with the registry, and publish the resulting plan.
          </p>
          <p className="text-muted mt-3 max-w-2xl text-xs leading-5">
            This workflow inspects provided contract data. It does not crawl or
            execute the provider website.
          </p>
        </header>

        <div className="mt-12 sm:mt-16">
          <PublishForm />
        </div>
      </div>
    </PageContainer>
  );
}
