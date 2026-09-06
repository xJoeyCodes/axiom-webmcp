import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { CapabilityList } from "@/components/provider/capability-list";
import { ProviderHeader } from "@/components/provider/provider-header";
import { RegistryMetadata } from "@/components/provider/registry-metadata";
import { getAxiomClient } from "@/lib/api/client";
import { getProviderVisitUrl } from "@/lib/config/provider-links";

interface ProviderPageProps {
  params: Promise<{ slug: string }>;
}

const loadProvider = cache((slug: string) =>
  getAxiomClient().getProvider(slug),
);

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await loadProvider(slug);

  return provider
    ? {
        title: provider.name,
        description: `${provider.description} Explore ${provider.capabilities.length} WebMCP capabilities.`,
      }
    : { title: "Provider not found" };
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params;
  const provider = await loadProvider(slug);

  if (!provider) {
    notFound();
  }

  return (
    <PageContainer>
      <div className="pt-8 pb-20 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-32">
        <ProviderHeader
          provider={provider}
          visitUrl={getProviderVisitUrl(provider)}
        />
        <CapabilityList capabilities={provider.capabilities} />
        <RegistryMetadata provider={provider} />
      </div>
    </PageContainer>
  );
}
