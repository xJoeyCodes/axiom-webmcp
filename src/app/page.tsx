import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { SingularityPlaceholder } from "@/components/hero/singularity-placeholder";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { buttonStyles } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { getAxiomClient } from "@/lib/api/client";

export default async function HomePage() {
  const providers = await getAxiomClient().discover("");
  const capabilityCount = providers.reduce(
    (count, result) => count + result.provider.capabilities.length,
    0,
  );

  return (
    <PageContainer>
      <Section className="grid min-h-[calc(100vh-10rem)] items-center gap-12 py-16 lg:grid-cols-[1.25fr_0.75fr] lg:py-20">
        <div className="max-w-3xl">
          <TechnicalLabel>
            Open discovery infrastructure / WebMCP
          </TechnicalLabel>
          <h1 className="text-foreground mt-8 text-[clamp(3.25rem,8vw,7rem)] leading-[0.92] font-normal tracking-[-0.065em]">
            Discover what the web can do.
          </h1>
          <p className="text-secondary mt-8 max-w-xl text-base leading-7 sm:text-lg">
            Axiom indexes WebMCP capabilities so agents can find websites by
            action, not just by content.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/discover" className={buttonStyles()}>
              Explore capabilities <ArrowRight aria-hidden size={15} />
            </Link>
            <Link
              href="/publish"
              className={buttonStyles({ variant: "secondary" })}
            >
              Publish a website
            </Link>
          </div>
          <Divider className="mt-16" />
          <dl className="text-muted mt-5 flex gap-10 font-mono text-[10px] tracking-[0.1em] uppercase">
            <div>
              <dt>Providers</dt>
              <dd className="text-secondary mt-2 text-sm tracking-normal">
                {String(providers.length).padStart(2, "0")}
              </dd>
            </div>
            <div>
              <dt>Capabilities</dt>
              <dd className="text-secondary mt-2 text-sm tracking-normal">
                {String(capabilityCount).padStart(2, "0")}
              </dd>
            </div>
            <div>
              <dt>Protocol</dt>
              <dd className="text-secondary mt-2 text-sm tracking-normal">
                WebMCP
              </dd>
            </div>
          </dl>
        </div>
        <SingularityPlaceholder />
      </Section>
    </PageContainer>
  );
}
