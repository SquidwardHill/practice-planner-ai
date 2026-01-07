"use client";

import { PlannerForm } from "@/components/molecules/planner-form";
import { AppFeature } from "@/components/organisms/access-control";
import { useUserAccess } from "@/hooks/useUserAccess";
import { SubscriptionRequired } from "@/components/molecules/subscription-required";

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
          message="Subscribe to unlock the AI Practice Planner"
          additionalMessage={additionalMessage}
        />
      }
    >
      <PlannerForm />
    </AppFeature>
  );
}
