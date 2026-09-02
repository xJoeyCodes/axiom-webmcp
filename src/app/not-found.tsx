import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer>
      <Section className="min-h-[60vh]">
        <p className="text-muted font-mono text-xs">404 / NOT FOUND</p>
        <h1 className="mt-5 text-4xl tracking-[-0.04em]">
          Unknown coordinate.
        </h1>
        <p className="text-secondary mt-4 max-w-md text-sm leading-6">
          The requested Axiom resource does not exist in the current index.
        </p>
        <Link href="/discover" className={buttonStyles({ className: "mt-8" })}>
          Return to discovery
        </Link>
      </Section>
    </PageContainer>
  );
}
