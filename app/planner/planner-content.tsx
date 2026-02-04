"use client";

import { PlannerForm } from "@/components/molecules/planner-form";
import { AskAiTypewriter } from "@/components/molecules/ask-ai-typewriter";
import { AppFeature } from "@/components/organisms/access-control";
import { useUserAccess } from "@/hooks/useUserAccess";
import { SubscriptionRequired } from "@/components/molecules/subscription-required";
import { PracticePlansDataTable } from "@/components/organisms/practice-plans-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCT_NAME_BASE } from "@/lib/config/branding";
import type { PracticePlanRow } from "@/components/organisms/practice-plans-data-table";
import { Sparkles, FileText } from "lucide-react";

interface PlannerContentProps {
  plans: PracticePlanRow[];
  totalPlans: number;
}

export function PlannerContent({ plans, totalPlans }: PlannerContentProps) {
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
      <Tabs defaultValue="generate">
        <TabsList className="grid max-w-sm grid-cols-2">
          <TabsTrigger value="generate" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <FileText className="h-4 w-4" />
            Saved plans
          </TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="space-y-6 mt-6 border rounded-lg p-6">
          <AskAiTypewriter />
          <PlannerForm />
        </TabsContent>
        <TabsContent value="saved" className="mt-6 border rounded-lg p-6">
          <PracticePlansDataTable data={plans} totalRows={totalPlans} />
        </TabsContent>
      </Tabs>
    </AppFeature>
  );
}
