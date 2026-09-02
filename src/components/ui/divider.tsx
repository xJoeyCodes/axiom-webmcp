import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Divider({
  className,
  ...props
}: HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      aria-hidden="true"
      className={cn("border-border w-full border-0 border-t", className)}
      {...props}
    />
  );
}
