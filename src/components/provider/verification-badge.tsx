import { BadgeCheck, CircleDashed, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { VerificationStatus } from "@/lib/types/axiom";

const statusContent = {
  verified: { label: "Verified", icon: BadgeCheck },
  pending: { label: "Pending", icon: Clock3 },
  unverified: { label: "Unverified", icon: CircleDashed },
} as const;

interface VerificationBadgeProps {
  status: VerificationStatus;
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const content = statusContent[status];
  const Icon = content.icon;

  return (
    <Badge
      className={
        status === "verified"
          ? "text-foreground border-white/20 bg-white/[0.045]"
          : "text-muted"
      }
    >
      <Icon aria-hidden size={12} strokeWidth={1.6} />
      {content.label}
    </Badge>
  );
}
