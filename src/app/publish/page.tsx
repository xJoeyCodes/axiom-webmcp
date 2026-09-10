import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { PublishForm } from "@/components/publish/publish-form";

export const metadata: Metadata = {
  title: "Add your website",
  description: "Inspect and publish a website's WebMCP actions to Axiom.",
};

interface PublishPageProps {
  searchParams: Promise<{ url?: string | string[] }>;
}

export default async function PublishPage({ searchParams }: PublishPageProps) {
  const parameters = await searchParams;
  const initialUrl = Array.isArray(parameters.url)
    ? parameters.url[0]
    : (parameters.url ?? "");

  return (
    <PageContainer>
      <div className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <header className="max-w-3xl">
          <TechnicalLabel>Website capability intake</TechnicalLabel>
          <h1 className="text-foreground mt-5 text-4xl font-normal tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Add your website to Axiom.
          </h1>
          <p className="text-secondary mt-6 max-w-2xl text-base leading-7 sm:text-lg">
            Enter your site URL. Axiom reads the WebMCP actions exposed to this
            origin, validates their contracts, and prepares them for discovery.
          </p>
          <p className="text-muted mt-3 max-w-2xl text-xs leading-5">
            Cross-origin sites must allow WebMCP inspection and expose their
            actions to Axiom. You can use an Axiom manifest when browser
            inspection is unavailable.
          </p>
        </header>

        <div className="mt-12 sm:mt-16">
          <PublishForm initialUrl={initialUrl} />
        </div>
      </div>
    </PageContainer>
  );
}
