import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Reveal } from "@/components/motion/reveal";
import { CodeBlock } from "@/components/ui/code-block";

const discoveryExample = `const result = await axiom.discover({
  intent: "reserve dinner"
});`;

export function AgentDeveloper() {
  return (
    <section
      aria-labelledby="agent-developer-title"
      className="border-border border-b py-24 sm:py-28 lg:py-32"
    >
      <PageContainer>
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
            <div>
              <p className="text-muted font-mono text-[10px] tracking-[0.15em] uppercase">
                The other side
              </p>
              <h2
                id="agent-developer-title"
                className="text-foreground mt-5 text-3xl font-normal tracking-[-0.04em] sm:text-4xl"
              >
                Built for agents too.
              </h2>
              <p className="text-secondary mt-5 max-w-md text-sm leading-7 sm:text-base">
                Once a website is indexed, agents query Axiom by intent and get
                the provider and actions needed to continue through WebMCP.
              </p>
              <Link
                href="/developers"
                className="text-secondary hover:text-foreground mt-7 inline-flex min-h-10 items-center gap-2 font-mono text-xs transition-colors duration-200"
              >
                Explore the developer API
                <ArrowRight aria-hidden size={13} strokeWidth={1.6} />
              </Link>
            </div>

            <div className="min-w-0">
              <CodeBlock label="Agent discovery" code={discoveryExample} />
              <div className="border-border mt-4 grid gap-3 border-y py-5 font-mono text-xs sm:grid-cols-[1fr_auto] sm:items-center">
                <span className="text-foreground">Atlas Dining</span>
                <span className="text-muted">→ make_reservation</span>
              </div>
            </div>
          </div>
        </Reveal>
      </PageContainer>
    </section>
  );
}
