"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useRef, useTransition } from "react";

interface DiscoverySearchProps {
  initialQuery: string;
}

export function DiscoverySearch({ initialQuery }: DiscoverySearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();

    if (!query) {
      inputRef.current?.focus();
      return;
    }

    const parameters = new URLSearchParams({ q: query });
    startTransition(() => {
      router.push(`/discover?${parameters.toString()}`);
    });
  }

  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={handleSubmit}
      aria-busy={isPending}
    >
      <label htmlFor="discovery-query" className="sr-only">
        Search websites by capability
      </label>
      <input
        ref={inputRef}
        id="discovery-query"
        name="q"
        type="search"
        defaultValue={initialQuery}
        required
        pattern=".*\S.*"
        title="Enter a capability to discover"
        placeholder="What does your agent need to do?"
        autoComplete="off"
        className="border-border-strong bg-elevated/70 text-foreground placeholder:text-muted focus-visible:ring-foreground focus-visible:ring-offset-background focus:bg-elevated h-14 w-full rounded-[5px] border px-4 pr-14 text-sm shadow-[0_16px_60px_rgba(0,0,0,0.18)] transition-[border-color,background-color] duration-200 hover:border-white/20 focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-16 sm:px-5 sm:pr-16 sm:text-base"
      />
      <button
        type="submit"
        aria-label="Search the capability index"
        className="bg-foreground text-background absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-[4px] transition-colors duration-200 hover:bg-white/85 disabled:opacity-50 sm:right-2.5 sm:size-11"
        disabled={isPending}
      >
        <ArrowRight aria-hidden size={17} strokeWidth={1.7} />
      </button>
      <span className="sr-only" aria-live="polite">
        {isPending ? "Searching capabilities" : ""}
      </span>
    </form>
  );
}
