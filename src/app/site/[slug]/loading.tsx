import { PageContainer } from "@/components/layout/page-container";

export default function Loading() {
  return (
    <PageContainer>
      <div
        className="flex min-h-[60vh] items-center py-20"
        role="status"
        aria-live="polite"
      >
        <div className="border-border flex w-full max-w-3xl items-center gap-4 border-y py-7">
          <span className="relative block size-6" aria-hidden="true">
            <span className="absolute top-1/2 left-0 size-1 -translate-y-1/2 animate-pulse rounded-full bg-white/25" />
            <span className="absolute top-0 left-1/2 size-1 -translate-x-1/2 animate-pulse rounded-full bg-white/55 [animation-delay:120ms]" />
            <span className="absolute right-0 bottom-1 size-1 animate-pulse rounded-full bg-white/35 [animation-delay:240ms]" />
          </span>
          <p className="text-secondary font-mono text-xs">
            Loading provider interface...
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
