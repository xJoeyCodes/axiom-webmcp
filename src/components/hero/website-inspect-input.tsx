"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { normalizeWebsiteUrl } from "@/lib/utils/url";

export function WebsiteInspectInput() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeWebsiteUrl(value);
    if (!normalized) {
      setError("Enter a valid website URL.");
      return;
    }

    const query = new URLSearchParams({ url: normalized });
    router.push(`/publish?${query.toString()}`);
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor="hero-website-url" className="sr-only">
        Website URL to inspect
      </label>
      <div className="relative">
        <input
          id="hero-website-url"
          name="url"
          type="url"
          inputMode="url"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "hero-website-url-error" : undefined}
          placeholder="https://yourwebsite.com"
          autoComplete="url"
          className="text-foreground placeholder:text-muted focus-visible:ring-foreground focus-visible:ring-offset-background h-14 w-full rounded-[6px] border border-white/15 bg-[#0b0c0f]/88 px-4 pr-28 text-sm shadow-[0_18px_70px_rgba(0,0,0,0.36)] backdrop-blur-md transition-[border-color,background-color] duration-200 hover:border-white/20 focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-16 sm:px-5 sm:pr-32 sm:text-base"
        />
        <button
          type="submit"
          aria-label="Inspect website"
          className="bg-foreground text-background absolute top-1/2 right-2 flex h-10 -translate-y-1/2 items-center justify-center gap-2 rounded-[4px] px-3.5 text-xs font-medium transition-colors duration-200 hover:bg-white/85 sm:right-2.5 sm:h-11 sm:px-4"
        >
          Inspect
          <ArrowRight aria-hidden size={14} strokeWidth={1.7} />
        </button>
      </div>
      {error ? (
        <p
          id="hero-website-url-error"
          role="alert"
          className="text-secondary mt-2 text-left text-xs"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
