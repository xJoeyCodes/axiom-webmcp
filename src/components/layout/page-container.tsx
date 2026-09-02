import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function PageContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10",
        className,
      )}
      {...props}
    />
  );
}
