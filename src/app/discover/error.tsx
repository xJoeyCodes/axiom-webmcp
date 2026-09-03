"use client";

import { DiscoveryError } from "@/components/discovery/discovery-error";
import { PageContainer } from "@/components/layout/page-container";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <PageContainer>
      <div className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <DiscoveryError onRetry={reset} />
      </div>
    </PageContainer>
  );
}
