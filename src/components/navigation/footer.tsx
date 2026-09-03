import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { siteConfig } from "@/lib/config/site";

export function Footer() {
  return (
    <footer className="border-border mt-auto border-t py-9">
      <PageContainer className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-secondary font-mono text-[11px] tracking-[0.18em]">
            AXIOM
          </p>
          <p className="text-muted mt-2 text-xs">
            Open-source discovery for the agentic web.
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="text-muted flex flex-wrap gap-5 text-xs"
        >
          <a
            className="hover:text-foreground transition-colors duration-200"
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <Link
            className="hover:text-foreground transition-colors duration-200"
            href="/docs"
          >
            Docs
          </Link>
          <Link
            className="hover:text-foreground transition-colors duration-200"
            href="/developers"
          >
            Developers
          </Link>
        </nav>
      </PageContainer>
    </footer>
  );
}
