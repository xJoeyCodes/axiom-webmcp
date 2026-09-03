export function DiscoveryLoading() {
  return (
    <div
      className="border-border mt-14 flex min-h-48 items-center border-t sm:mt-16"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <span className="relative block size-6" aria-hidden="true">
          <span className="absolute top-1/2 left-0 size-1 -translate-y-1/2 animate-pulse rounded-full bg-white/25" />
          <span className="absolute top-0 left-1/2 size-1 -translate-x-1/2 animate-pulse rounded-full bg-white/55 [animation-delay:120ms]" />
          <span className="absolute right-0 bottom-1 size-1 animate-pulse rounded-full bg-white/35 [animation-delay:240ms]" />
        </span>
        <p className="text-secondary font-mono text-xs">
          Searching capabilities...
        </p>
      </div>
    </div>
  );
}
