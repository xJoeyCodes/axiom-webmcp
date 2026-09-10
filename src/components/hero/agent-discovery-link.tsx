import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function AgentDiscoveryLink() {
  return (
    <p className="text-muted text-xs sm:text-sm">
      Building an agent?{" "}
      <Link
        href="/discover"
        className="text-secondary hover:text-foreground inline-flex min-h-8 items-center gap-1.5 transition-colors duration-200"
      >
        Discover web capabilities
        <ArrowRight aria-hidden size={12} strokeWidth={1.6} />
      </Link>
    </p>
  );
}
