"use client";

import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { normalizeWebsiteUrl } from "@/lib/utils/url";

interface WebsiteInspectFormProps {
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  value: string;
}

export function WebsiteInspectForm({
  disabled = false,
  error,
  onChange,
  onSubmit,
  value,
}: WebsiteInspectFormProps) {
  const valid =
    value.trim().startsWith("/") || normalizeWebsiteUrl(value) !== null;

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-5xl">
      <label htmlFor="website-url" className="text-secondary text-sm">
        Website URL
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="website-url"
          name="url"
          type="url"
          inputMode="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby="website-url-help website-url-error"
          autoComplete="url"
          placeholder="https://yourwebsite.com"
          className="border-border bg-elevated text-foreground placeholder:text-muted focus-visible:border-border-strong focus-visible:ring-foreground/70 h-12 min-w-0 flex-1 rounded-sm border px-4 text-sm transition-[border-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0C] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button
          type="submit"
          disabled={!valid || disabled}
          className="h-12 px-5"
        >
          {disabled ? "Inspecting" : "Inspect website"}
          <ArrowRight aria-hidden size={14} strokeWidth={1.6} />
        </Button>
      </div>
      {error ? (
        <p
          id="website-url-error"
          className="text-secondary mt-3 text-xs leading-5"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <p
        id="website-url-help"
        className={`text-muted mt-3 max-w-3xl text-xs leading-5 ${error ? "sr-only" : ""}`}
      >
        Axiom opens the site in your browser and reads exposed WebMCP action
        contracts. It never executes the actions during inspection.
      </p>
    </form>
  );
}

interface ManifestInspectFormProps {
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
  onLoadExample: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  value: string;
}

export function ManifestInspectForm({
  disabled = false,
  error,
  onChange,
  onLoadExample,
  onSubmit,
  value,
}: ManifestInspectFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="axiom-manifest" className="text-secondary text-sm">
          Axiom manifest
        </label>
        <Button
          type="button"
          variant="quiet"
          onClick={onLoadExample}
          disabled={disabled}
          className="min-h-10 px-0"
        >
          Load example
        </Button>
      </div>
      <textarea
        id="axiom-manifest"
        name="manifest"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby="axiom-manifest-help axiom-manifest-error"
        spellCheck={false}
        placeholder={
          '{\n  "version": "1",\n  "provider": { ... },\n  "capabilities": [ ... ]\n}'
        }
        className="border-border bg-elevated text-foreground placeholder:text-muted focus-visible:border-border-strong focus-visible:ring-foreground/70 mt-3 min-h-80 w-full resize-y rounded-sm border px-4 py-4 font-mono text-xs leading-6 transition-[border-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0C] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-96 sm:px-5"
      />
      <div className="mt-3 flex min-h-10 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {error ? (
            <p
              id="axiom-manifest-error"
              className="text-secondary text-xs leading-5"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <p
            id="axiom-manifest-help"
            className={`text-muted text-xs leading-5 ${error ? "sr-only" : ""}`}
          >
            Use a manifest when browser inspection is unavailable or the site
            cannot expose tools cross-origin.
          </p>
        </div>
        <Button type="submit" disabled={!value.trim() || disabled}>
          {disabled ? "Inspecting" : "Inspect manifest"}
          <ArrowRight aria-hidden size={14} strokeWidth={1.6} />
        </Button>
      </div>
    </form>
  );
}
