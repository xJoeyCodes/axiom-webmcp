import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { TechnicalLabel } from "@/components/layout/technical-label";
import { VerificationBadge } from "@/components/provider/verification-badge";
import { buttonStyles } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import type { Provider } from "@/lib/types/axiom";
import { formatIndexedDate } from "@/lib/utils/date";

interface ProviderHeaderProps {
  provider: Provider;
  visitUrl: string | null;
}

export function ProviderHeader({ provider, visitUrl }: ProviderHeaderProps) {
  return (
    <header className="border-border border-b pb-14 sm:pb-16 lg:pb-20">
      <Link
        href="/discover"
        className="text-muted hover:text-foreground inline-flex min-h-10 items-center gap-2 text-sm transition-colors duration-200"
      >
        <ArrowLeft aria-hidden size={14} strokeWidth={1.6} />
        Discover
      </Link>

      <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end lg:gap-16">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <TechnicalLabel>Provider / {provider.slug}</TechnicalLabel>
            <VerificationBadge status={provider.verificationStatus} />
          </div>
          <h1 className="text-foreground mt-6 text-4xl font-normal tracking-[-0.04em] sm:text-5xl lg:text-[52px] lg:leading-[1.05]">
            {provider.name}
          </h1>
          <div className="mt-5 flex min-w-0 flex-wrap items-center gap-1">
            <p className="text-secondary min-w-0 font-mono text-xs break-all sm:text-[13px]">
              {provider.domain}
            </p>
            <CopyButton value={provider.domain} label="Copy domain" />
          </div>
          <p className="text-secondary mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
            {provider.description}
          </p>
        </div>

        <div className="border-border border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <dl className="space-y-5 font-mono text-[10px]">
            <div>
              <dt className="text-muted tracking-[0.1em] uppercase">
                Last indexed
              </dt>
              <dd className="text-secondary mt-2 text-[11px]">
                {formatIndexedDate(provider.lastIndexed)}
              </dd>
            </div>
            <div>
              <dt className="text-muted tracking-[0.1em] uppercase">
                Capabilities
              </dt>
              <dd className="text-foreground mt-2 text-2xl tracking-[-0.04em]">
                {String(provider.capabilities.length).padStart(2, "0")}
              </dd>
            </div>
          </dl>

          {visitUrl ? (
            <a
              href={visitUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visit ${provider.name} website in a new tab`}
              className={buttonStyles({
                variant: "secondary",
                className: "mt-7 w-full sm:w-auto lg:w-full",
              })}
            >
              Visit website
              <ArrowUpRight aria-hidden size={14} strokeWidth={1.6} />
            </a>
          ) : (
            <p className="text-muted mt-7 font-mono text-[10px]">
              Demo provider · no public destination
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
