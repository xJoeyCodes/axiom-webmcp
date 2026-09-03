import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils/cn";

interface CodeBlockProps {
  className?: string;
  code: string;
  label: string;
}

export function CodeBlock({ className, code, label }: CodeBlockProps) {
  return (
    <figure
      className={cn(
        "border-border-strong bg-elevated overflow-hidden rounded-[5px] border",
        className,
      )}
    >
      <figcaption className="border-border flex min-h-11 items-center justify-between gap-3 border-b px-3">
        <span className="text-muted truncate font-mono text-[9px] tracking-[0.11em] uppercase">
          {label}
        </span>
        <CopyButton value={code} label="Copy" />
      </figcaption>
      <pre className="text-secondary overflow-x-auto p-4 font-mono text-[11px] leading-6 sm:p-5 sm:text-xs">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
