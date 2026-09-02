import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "border-border-strong bg-surface text-secondary inline-flex items-center rounded-[4px] border px-2 py-1 font-mono text-[10px] leading-none tracking-[0.08em] uppercase",
        className,
      )}
      {...props}
    />
  );
}
