import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function TechnicalLabel({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-muted font-mono text-[10px] leading-none tracking-[0.16em] uppercase",
        className,
      )}
      {...props}
    />
  );
}
