import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface SuggestedIntentsProps {
  intents: string[];
}

export function SuggestedIntents({ intents }: SuggestedIntentsProps) {
  return (
    <ul
      className="flex flex-wrap gap-x-5 gap-y-3"
      aria-label="Suggested searches"
    >
      {intents.map((intent) => (
        <li key={intent}>
          <Link
            href={`/discover?${new URLSearchParams({ q: intent }).toString()}`}
            className="text-muted hover:text-foreground focus-visible:text-foreground inline-flex min-h-8 items-center gap-1.5 font-mono text-[11px] transition-colors duration-200"
          >
            {intent}
            <ArrowUpRight aria-hidden size={12} strokeWidth={1.5} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
