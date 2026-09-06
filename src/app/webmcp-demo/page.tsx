import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { TechnicalLabel } from "@/components/layout/technical-label";
import { AtlasDiningDemo } from "@/components/webmcp/atlas-dining-demo";

export const metadata: Metadata = {
  title: "Atlas Dining WebMCP demo",
  description:
    "A minimal Atlas Dining provider demonstrating real WebMCP tool registration.",
};

export default function WebMcpDemoPage() {
  return (
    <PageContainer>
      <main className="pt-16 pb-24 sm:pt-20 lg:pt-24 lg:pb-32">
        <header className="border-border max-w-3xl border-b pb-12 sm:pb-16">
          <TechnicalLabel>Experimental provider / Atlas Dining</TechnicalLabel>
          <h1 className="text-foreground mt-6 text-4xl font-normal tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            WebMCP, registered for real.
          </h1>
          <p className="text-secondary mt-6 max-w-2xl text-base leading-7 sm:text-lg">
            A small provider proof for Axiom&apos;s indexed Atlas Dining
            capabilities. The page progressively registers three browser tools
            without changing the human experience.
          </p>
        </header>
        <div className="mt-12 sm:mt-16">
          <AtlasDiningDemo />
        </div>
      </main>
    </PageContainer>
  );
}
