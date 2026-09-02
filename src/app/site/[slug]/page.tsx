import { BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { CapabilityList } from "@/components/provider/capability-list";
import { Badge } from "@/components/ui/badge";
import { getAxiomClient } from "@/lib/api/client";

interface ProviderPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getAxiomClient().getProvider(slug);
  return { title: provider?.name ?? "Provider not found" };
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params;
  const provider = await getAxiomClient().getProvider(slug);

  if (!provider) notFound();

  return (
    <PageContainer>
      <Section>
        <header className="border-border border-b pb-12 sm:pb-16">
          <div className="flex flex-wrap items-center gap-3">
            <TechnicalLabel>Provider / {provider.slug}</TechnicalLabel>
            {provider.verified ? (
              <Badge className="gap-1.5">
                <BadgeCheck aria-hidden size={12} /> Verified
              </Badge>
            ) : null}
          </div>
          <h1 className="text-foreground mt-6 text-4xl font-normal tracking-[-0.04em] sm:text-6xl">
            {provider.name}
          </h1>
          <p className="text-secondary mt-5 max-w-2xl text-base leading-7">
            {provider.description}
          </p>
          <dl className="border-border bg-border mt-10 grid max-w-3xl grid-cols-1 gap-px border font-mono text-[11px] sm:grid-cols-3">
            <div className="bg-background p-4">
              <dt className="text-muted">Domain</dt>
              <dd className="text-secondary mt-2">{provider.domain}</dd>
            </div>
            <div className="bg-background p-4">
              <dt className="text-muted">Capabilities</dt>
              <dd className="text-secondary mt-2">
                {provider.capabilities.length}
              </dd>
            </div>
            <div className="bg-background p-4">
              <dt className="text-muted">Last indexed</dt>
              <dd className="text-secondary mt-2">
                {provider.lastIndexed.slice(0, 10)}
              </dd>
            </div>
          </dl>
        </header>
        <div className="pt-12">
          <TechnicalLabel className="mb-6">Exposed capabilities</TechnicalLabel>
          <CapabilityList capabilities={provider.capabilities} />
        </div>
      </Section>
    </PageContainer>
  );
}
