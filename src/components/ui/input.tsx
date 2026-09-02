import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "border-border-strong bg-elevated text-foreground placeholder:text-muted focus-visible:ring-foreground focus-visible:ring-offset-background h-11 w-full rounded-[5px] border px-3.5 text-sm transition-colors duration-200 hover:border-white/20 focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
