import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isValidSubscription } from "@/lib/types/subscription";
import { PlannerForm } from "@/components/planner-form";
import { Lock } from "lucide-react";
import { H1, H3, P, Small } from "@/components/typography";

export default async function PlannerPage() {
  const { user, subscription } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  const hasAccess = isValidSubscription(subscription?.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12">
        <H1>Practice Planner</H1>
        <P className="text-muted-foreground mt-1">
          Generate AI-powered practice plans from your drill library
        </P>
      </div>

      {!hasAccess && (
        <div className="mb-12 p-6 border border-destructive/50 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-5 w-5" />
            <H3>Subscription Required</H3>
          </div>
          <P className="text-muted-foreground mb-4">
            An active subscription is required to generate practice plans
          </P>
          <div className="space-y-2">
            {subscription?.status === "unset" && (
              <Small className="text-muted-foreground">
                Please link your Shopify account to get started.
              </Small>
            )}
            {(subscription?.status === "expired" ||
              subscription?.status === "cancelled") && (
              <Small className="text-muted-foreground">
                Your subscription has expired or been cancelled. Please renew to
                continue using this feature.
              </Small>
            )}
            <Button variant="outline">Manage Subscription</Button>
          </div>
        </div>
      )}

      <div className={hasAccess ? "" : "pointer-events-none opacity-50"}>
        <PlannerForm />
      </div>
    </div>
  );
}
