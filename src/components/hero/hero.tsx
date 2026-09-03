import { HeroSearch } from "@/components/hero/hero-search";
import { SingularityHero } from "@/components/hero/singularity-hero";
import { SuggestedQueries } from "@/components/hero/suggested-queries";
import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";

export function Hero() {
  return (
    <section className="border-border relative isolate flex min-h-[100svh] items-center overflow-hidden border-b">
      <SingularityHero />
      <PageContainer className="relative z-10 flex justify-center pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="w-full max-w-[860px] text-center">
          <TechnicalLabel>
            Open discovery infrastructure / WebMCP
          </TechnicalLabel>
          <h1 className="text-foreground mt-7 text-[clamp(2.75rem,7vw,5rem)] leading-[0.96] font-normal tracking-[-0.055em] text-balance sm:mt-9">
            Discover what the web can do.
          </h1>
          <p className="text-secondary mt-6 text-lg leading-7 sm:text-xl">
            The open discovery layer for WebMCP.
          </p>
          <p className="text-muted mx-auto mt-2 max-w-lg text-sm leading-6 sm:text-base">
            Search websites by the capabilities they expose to agents.
          </p>

          <div className="mx-auto mt-9 max-w-[760px] sm:mt-11">
            <HeroSearch />
            <div className="mt-4">
              <SuggestedQueries />
            </div>
          </div>

          <p className="text-muted mt-10 font-mono text-[9px] tracking-[0.13em] uppercase sm:mt-12">
            Open source <span className="mx-2 text-white/20">·</span> WebMCP
            native
            <span className="mx-2 text-white/20">·</span> Agent-first
          </p>
        </div>
      </PageContainer>
    </section>
  );
}
