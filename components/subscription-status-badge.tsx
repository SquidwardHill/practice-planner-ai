import { Badge } from "@/components/ui/badge";
import {
  SubscriptionStatus,
  type SubscriptionStatusType,
} from "@/lib/types/subscription";

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
      return "Active";
    case SubscriptionStatus.TRIAL:
      return "Trial";
    case SubscriptionStatus.EXPIRED:
      return "Expired";
    case SubscriptionStatus.CANCELLED:
      return "Cancelled";
    case SubscriptionStatus.UNSET:
    default:
      return "Not Set";
  }
}

export function SubscriptionStatusBadge({
  status,
  className,
}: SubscriptionStatusBadgeProps) {
  const normalizedStatus =
    (status as SubscriptionStatusType) || SubscriptionStatus.UNSET;

  return (
    <Badge
      variant={getStatusBadgeVariant(normalizedStatus)}
      className={className}
    >
      {getStatusLabel(normalizedStatus)}
    </Badge>
  );
}
