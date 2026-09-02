import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";

export function Footer() {
  return (
    <footer className="border-border mt-auto border-t py-8">
      <PageContainer className="text-muted flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono tracking-[0.12em]">AXIOM / WEBMCP DISCOVERY</p>
        <div className="flex gap-5">
          <Link
            className="hover:text-foreground transition-colors"
            href="/publish"
          >
            Publish
          </Link>
          <Link
            className="hover:text-foreground transition-colors"
            href="/docs"
          >
            Documentation
          </Link>
        </div>
      </PageContainer>
    </footer>
  );
}
