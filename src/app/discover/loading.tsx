import { DiscoveryLoading } from "@/components/discovery/discovery-loading";
import { PageContainer } from "@/components/layout/page-container";

export default function Loading() {
  return (
    <PageContainer>
      <div className="pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <div className="bg-surface h-3 w-28 animate-pulse rounded-sm" />
        <div className="bg-surface-hover mt-6 h-12 w-56 animate-pulse rounded-sm" />
        <div className="bg-surface mt-5 h-5 w-full max-w-lg animate-pulse rounded-sm" />
        <div className="border-border-strong bg-elevated/70 mt-12 h-16 max-w-4xl rounded-[5px] border" />
        <DiscoveryLoading />
      </div>
    </PageContainer>
  );
}
