import { Badge } from "@/components/ui/badge";
import {
  SubscriptionStatus,
  type SubscriptionStatusType,
} from "@/lib/types/subscription";
import {
  BadgeCheck,
  FlaskConical,
  BadgeAlert,
  BadgeX,
  CircleDashed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getStatusIcon(status: string): LucideIcon {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return BadgeCheck;
    case SubscriptionStatus.TRIAL:
      return FlaskConical;
    case SubscriptionStatus.EXPIRED:
      return BadgeAlert;
    case SubscriptionStatus.CANCELLED:
      return BadgeX;
    case SubscriptionStatus.UNSET:
    default:
      return CircleDashed;
  }
}

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatusType | string | null | undefined;
  className?: string;
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "default";
    case SubscriptionStatus.TRIAL:
      return "secondary";
    case SubscriptionStatus.EXPIRED:
    case SubscriptionStatus.CANCELLED:
      return "destructive";
    case SubscriptionStatus.UNSET:
    default:
      return "outline";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "active";
    case SubscriptionStatus.TRIAL:
      return "trial";
    case SubscriptionStatus.EXPIRED:
      return "expired";
    case SubscriptionStatus.CANCELLED:
      return "cancelled";
    case SubscriptionStatus.UNSET:
    default:
      return "inactive";
  }
}

export function SubscriptionStatusBadge({
  status,
  className,
}: SubscriptionStatusBadgeProps) {
  const normalizedStatus =
    (status as SubscriptionStatusType) || SubscriptionStatus.UNSET;

  const Icon = getStatusIcon(normalizedStatus);

  return (
    <Badge
      className={cn(
        "gap-0.5 text-xs outline outline-muted-foreground/10 bg-background px-1.5 py-0.25",
        className
      )}
    >
      <Icon className="size-2.5 shrink-0 text-muted-foreground/90" />
      <span className="text-[11px] font-thin font-mono tracking-tighter text-muted-foreground/90">
        {getStatusLabel(normalizedStatus)}
      </span>
    </Badge>
  );
}
