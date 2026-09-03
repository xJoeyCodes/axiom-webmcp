"use client";

import { Check, Copy, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  value: string;
  label?: string;
}

type CopyState = "idle" | "copied" | "error";

export function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timeout = window.setTimeout(() => setState("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
  }

  const statusLabel =
    state === "copied" ? "Copied" : state === "error" ? "Copy failed" : label;

  return (
    <Button
      size="sm"
      variant="quiet"
      onClick={copy}
      aria-label={
        state === "copied"
          ? "Copied to clipboard"
          : state === "error"
            ? "Copy failed. Try again"
            : `${label} to clipboard`
      }
    >
      {state === "copied" ? (
        <Check aria-hidden size={14} />
      ) : state === "error" ? (
        <TriangleAlert aria-hidden size={14} />
      ) : (
        <Copy aria-hidden size={14} />
      )}
      <span aria-live="polite">{statusLabel}</span>
    </Button>
  );
}
