"use client";

import { PlannerForm } from "@/components/molecules/planner-form";
import { AppFeature } from "@/components/organisms/access-control";
import { useUserAccess } from "@/hooks/useUserAccess";
import { SubscriptionRequired } from "@/components/molecules/subscription-required";
import { PRODUCT_NAME_BASE } from "@/lib/config/branding";

export function PlannerContent() {
  const { subscriptionStatus } = useUserAccess();

  const additionalMessage =
    subscriptionStatus === "expired" || subscriptionStatus === "cancelled"
      ? "Your subscription has expired or been cancelled. Please renew to continue using this feature."
      : undefined;

  return (
    <AppFeature
      subscribePrompt={
        <SubscriptionRequired
          message={`Subscribe to unlock the AI ${PRODUCT_NAME_BASE}`}
          additionalMessage={additionalMessage}
        />
      }
    >
      <PlannerForm />
    </AppFeature>
  );
}
