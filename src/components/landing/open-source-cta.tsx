import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Reveal } from "@/components/motion/reveal";
import { buttonStyles } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";

const traits = [
  "Open source",
  "Self-hostable",
  "CLI / SDK ready",
  "Agent-neutral",
];

export function OpenSourceCta() {
  return (
    <section
      aria-labelledby="open-source-title"
      className="py-24 sm:py-32 lg:py-40"
    >
      <PageContainer>
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-muted font-mono text-[10px] tracking-[0.15em] uppercase">
                Public infrastructure
              </p>
              <h2
                id="open-source-title"
                className="text-foreground mt-5 text-4xl font-normal tracking-[-0.045em] sm:text-5xl"
              >
                Built in the open.
              </h2>
              <p className="text-secondary mt-5 max-w-xl text-sm leading-7 sm:text-base">
                Axiom is designed as open, portable discovery infrastructure for
                every agent and every WebMCP-enabled website.
              </p>
              <ul className="text-muted mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] tracking-[0.08em] uppercase">
                {traits.map((trait) => (
                  <li key={trait} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-1 rounded-full bg-white/35"
                    />
                    {trait}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({ className: "h-11 px-5" })}
              >
                View on GitHub <ArrowUpRight aria-hidden size={14} />
              </a>
              <Link
                href="/developers"
                className={buttonStyles({
                  variant: "secondary",
                  className: "h-11 px-5",
                })}
              >
                For developers
              </Link>
            </div>
          </div>
        </Reveal>
      </PageContainer>
    </section>
  );
}
