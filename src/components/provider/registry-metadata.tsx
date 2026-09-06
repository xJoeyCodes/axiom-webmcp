import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { TechnicalLabel } from "@/components/layout/technical-label";
import { CopyButton } from "@/components/ui/copy-button";
import type { Provider } from "@/lib/types/axiom";
import { formatIndexedDate } from "@/lib/utils/date";

interface RegistryMetadataProps {
  provider: Provider;
}

export function RegistryMetadata({ provider }: RegistryMetadataProps) {
  const fields: Array<{ label: string; value: string }> = [
    { label: "Last indexed", value: formatIndexedDate(provider.lastIndexed) },
    {
      label: "WebMCP status",
      value: provider.lastIndexed ? "Indexed" : "Registered",
    },
    { label: "Capabilities", value: String(provider.capabilities.length) },
  ];
  if (provider.metadata.industry) {
    fields.push({ label: "Industry", value: provider.metadata.industry });
  }
  if (provider.metadata.location) {
    fields.push({ label: "Location", value: provider.metadata.location });
  }

  return (
    <section
      aria-labelledby="registry-metadata-title"
      className="border-border mt-20 border-t pt-14 sm:mt-24 sm:pt-16"
    >
      <TechnicalLabel>Registry metadata</TechnicalLabel>
      <h2 id="registry-metadata-title" className="sr-only">
        Registry metadata
      </h2>

      <dl className="mt-8 max-w-4xl border-t border-white/10 font-mono text-[10px]">
        <div className="border-border grid gap-2 border-b py-4 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-center">
          <dt className="text-muted">Provider ID</dt>
          <dd className="text-secondary min-w-0 break-all">{provider.id}</dd>
          <dd className="sm:justify-self-end">
            <CopyButton value={provider.id} label="Copy ID" />
          </dd>
        </div>
        {fields.map((field) => (
          <div
            key={field.label}
            className="border-border grid gap-2 border-b py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center"
          >
            <dt className="text-muted">{field.label}</dt>
            <dd className="text-secondary break-words">{field.value}</dd>
          </div>
        ))}
      </dl>

      <Link
        href="/discover"
        className="text-secondary hover:text-foreground mt-10 inline-flex min-h-10 items-center gap-2 text-sm transition-colors duration-200"
      >
        Explore more providers
        <ArrowRight aria-hidden size={14} strokeWidth={1.6} />
      </Link>
    </section>
  );
}
