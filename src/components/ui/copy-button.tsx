"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  }

  return (
    <Button
      size="sm"
      variant="quiet"
      onClick={copy}
      aria-label={copied ? "Copied to clipboard" : `${label} to clipboard`}
    >
      {copied ? (
        <Check aria-hidden size={14} />
      ) : (
        <Copy aria-hidden size={14} />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}
