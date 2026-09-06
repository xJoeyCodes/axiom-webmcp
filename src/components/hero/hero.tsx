import { AgentDiscoveryLink } from "@/components/hero/agent-discovery-link";
import { SingularityHero } from "@/components/hero/singularity-hero";
import { WebsiteInspectInput } from "@/components/hero/website-inspect-input";
import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";

export function Hero() {
  return (
    <section className="border-border relative isolate flex min-h-[100svh] items-center overflow-hidden border-b">
      <SingularityHero />
      <PageContainer className="relative z-10 flex justify-center pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="w-full max-w-[920px] text-center">
          <TechnicalLabel>
            Open discovery infrastructure / WebMCP
          </TechnicalLabel>
          <h1 className="text-foreground mt-7 text-[clamp(2.7rem,6.7vw,5rem)] leading-[0.96] font-normal tracking-[-0.055em] text-balance sm:mt-9">
            Make your website discoverable to agents.
          </h1>
          <p className="text-secondary mx-auto mt-6 max-w-2xl text-base leading-7 sm:text-xl">
            Axiom inspects the WebMCP actions your website exposes and indexes
            them for agent discovery.
          </p>
          <p className="text-muted mx-auto mt-2 max-w-xl text-sm leading-6 sm:text-base">
            Enter your website URL to see what agents can do with it.
          </p>

          <div className="mx-auto mt-9 max-w-[760px] sm:mt-11">
            <WebsiteInspectInput />
            <div className="mt-5">
              <AgentDiscoveryLink />
            </div>
          </div>

          <p className="text-muted mt-9 font-mono text-[9px] tracking-[0.13em] uppercase sm:mt-11">
            WebMCP native <span className="mx-2 text-white/20">·</span> Open
            source <span className="mx-2 text-white/20">·</span> Agent
            discoverable
          </p>
        </div>
      </PageContainer>
    </section>
  );
}
