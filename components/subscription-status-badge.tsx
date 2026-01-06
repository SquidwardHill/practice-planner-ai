import { Badge } from "@/components/ui/badge";
import {
  SubscriptionStatus,
  type SubscriptionStatusType,
} from "@/lib/types/subscription";
import { User } from "lucide-react";

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
      className={"text-xs" + className}
    >
      <User className="h-3 w-3 mr-1" />
      <span className="font-medium font-mono tracking-tighter">
        {getStatusLabel(normalizedStatus)}
      </span>
    </Badge>
  );
}
