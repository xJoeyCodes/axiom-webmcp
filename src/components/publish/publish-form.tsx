"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAxiomClient } from "@/lib/api/client";
import type { PublishResult } from "@/lib/types/axiom";

export function PublishForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setResult(null);

    const response = await getAxiomClient().publish({
      url: String(formData.get("url") ?? ""),
      contactEmail: String(formData.get("email") ?? "") || undefined,
    });

    setResult(response);
    setPending(false);
  }

  return (
    <div className="max-w-2xl">
      <form
        action={submit}
        className="space-y-6"
        aria-describedby="publish-note"
      >
        <div>
          <label
            htmlFor="site-url"
            className="text-secondary mb-2 block text-sm"
          >
            Website URL
          </label>
          <Input
            id="site-url"
            name="url"
            type="url"
            required
            placeholder="https://example.com"
            autoComplete="url"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="text-secondary mb-2 block text-sm"
          >
            Contact email <span className="text-muted">(optional)</span>
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            placeholder="developer@example.com"
            autoComplete="email"
          />
        </div>
        <p id="publish-note" className="text-muted text-xs leading-5">
          This frontend preview uses a local mock inspector. It does not submit
          data to an external service.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Inspecting…" : "Inspect website"}
        </Button>
      </form>

      {result ? (
        <div
          className="border-border mt-8 border-t pt-6"
          role="status"
          aria-live="polite"
        >
          <p className="text-muted font-mono text-[10px] tracking-[0.12em] uppercase">
            {result.status} / {result.verificationStatus}
          </p>
          <p className="text-secondary mt-3 text-sm">{result.message}</p>
          {result.submissionId ? (
            <p className="text-muted mt-2 font-mono text-[11px]">
              {result.submissionId}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
