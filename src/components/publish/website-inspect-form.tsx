"use client";

import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeWebsiteUrl } from "@/lib/utils/url";

interface WebsiteInspectFormProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  value: string;
}

export function WebsiteInspectForm({
  disabled = false,
  onChange,
  onSubmit,
  value,
}: WebsiteInspectFormProps) {
  const invalid = value.length > 0 && !normalizeWebsiteUrl(value);
  const canSubmit = Boolean(normalizeWebsiteUrl(value)) && !disabled;
  const describedBy = invalid
    ? "website-url-error website-url-help"
    : "website-url-help";

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-4xl">
      <label htmlFor="website-url" className="text-secondary block text-sm">
        Website
      </label>
      <div className="relative mt-3">
        <Input
          id="website-url"
          name="url"
          type="url"
          inputMode="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          placeholder="https://northstar.example"
          autoComplete="url"
          className="h-14 pr-32 sm:h-16 sm:pr-36 sm:text-base"
        />
        <Button
          type="submit"
          disabled={!canSubmit}
          className="absolute top-1/2 right-2 -translate-y-1/2 sm:right-2.5"
        >
          {disabled ? "Inspecting" : "Inspect"}
          <ArrowRight aria-hidden size={14} strokeWidth={1.6} />
        </Button>
      </div>
      <div className="mt-3 min-h-5">
        {invalid ? (
          <p
            id="website-url-error"
            className="text-secondary text-xs"
            role="alert"
          >
            Enter an absolute HTTP or HTTPS URL.
          </p>
        ) : null}
        <p
          id="website-url-help"
          className={`text-muted text-xs leading-5 ${invalid ? "sr-only" : ""}`}
        >
          Try https://northstar.example for the deterministic WebMCP demo.
        </p>
      </div>
    </form>
  );
}
