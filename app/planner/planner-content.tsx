"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  /** Initial tab when opening with ?tab=saved (e.g. from "Back to saved plans") */
  initialTab?: "generate" | "saved";
  /** When true, clear cached draft so no plan shows under the planner (e.g. when returning from plan editor) */
  clearDraft?: boolean;
}

export function PlannerContent({
  plans,
  totalPlans,
  initialTab = "generate",
  clearDraft = false,
}: PlannerContentProps) {
  const router = useRouter();
  const { subscriptionStatus } = useUserAccess();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const generateTabRef = useRef<HTMLDivElement | null>(null);

  const additionalMessage =
    subscriptionStatus === "expired" || subscriptionStatus === "cancelled"
      ? "Your subscription has expired or been cancelled. Please renew to continue using this feature."
      : undefined;

  const handleSelectPlan = (plan: PracticePlanRow) => {
    router.push(`/planner/${plan.id}`);
  };

  return (
    <AppFeature
      subscribePrompt={
        <SubscriptionRequired
          message={`Subscribe to unlock the AI ${PRODUCT_NAME_BASE}`}
          additionalMessage={additionalMessage}
        />
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="text-base">
          <TabsTrigger value="generate" className="gap-2 text-base p-4">
            <Sparkles className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2 text-base p-4">
            <FileText className="h-4 w-4" />
            Saved plans
          </TabsTrigger>
        </TabsList>
        <TabsContent
          ref={generateTabRef}
          value="generate"
          className="space-y-6 mt-6 border rounded-lg p-6 scroll-mt-4"
        >
          <AskAiTypewriter />
          <PlannerForm clearDraft={clearDraft} />
        </TabsContent>
        <TabsContent value="saved" className="mt-6 border rounded-lg p-6">
          <PracticePlansDataTable
            data={plans}
            totalRows={totalPlans}
            onSelectPlan={handleSelectPlan}
          />
        </TabsContent>
      </Tabs>
    </AppFeature>
  );
}
