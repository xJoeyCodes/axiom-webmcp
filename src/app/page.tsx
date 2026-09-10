import { Hero } from "@/components/hero/hero";
import { AgentDeveloper } from "@/components/landing/agent-developer";
import { DiscoveryFlow } from "@/components/landing/discovery-flow";
import { OpenSourceCta } from "@/components/landing/open-source-cta";
import { ProductExplanation } from "@/components/landing/product-explanation";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductExplanation />
      <DiscoveryFlow />
      <AgentDeveloper />
      <OpenSourceCta />
    </>
  );
}
