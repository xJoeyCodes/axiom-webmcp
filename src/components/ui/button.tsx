import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "quiet";
export type ButtonSize = "sm" | "md";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-[5px] font-medium whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:bg-white/85",
  secondary:
    "border border-border-strong bg-transparent text-foreground hover:bg-surface-hover",
  quiet: "text-secondary hover:bg-surface-hover hover:text-foreground",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
