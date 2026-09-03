import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { buttonStyles } from "@/components/ui/button";

export default function ProviderNotFound() {
  return (
    <PageContainer>
      <section className="flex min-h-[65vh] flex-col justify-center py-20">
        <p className="text-muted font-mono text-[10px] tracking-[0.14em] uppercase">
          Registry / 404
        </p>
        <h1 className="text-foreground mt-6 text-4xl font-normal tracking-[-0.04em] sm:text-5xl">
          Provider not found.
        </h1>
        <p className="text-secondary mt-5 max-w-lg text-sm leading-6 sm:text-base sm:leading-7">
          This WebMCP provider does not exist in the current registry.
        </p>
        <Link
          href="/discover"
          className={buttonStyles({
            variant: "secondary",
            className: "mt-8 w-fit",
          })}
        >
          <ArrowLeft aria-hidden size={14} strokeWidth={1.6} />
          Back to Discover
        </Link>
      </section>
    </PageContainer>
  );
}
