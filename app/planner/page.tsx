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

export default async function PlannerPage() {
  const { user, subscription } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  const hasAccess = isValidSubscription(subscription?.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Practice Planner</h1>
        <p className="text-muted-foreground mt-2">
          Generate AI-powered practice plans from your drill library
        </p>
      </div>

      {!hasAccess && (
        <Card className="mb-6 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Subscription Required
            </CardTitle>
            <CardDescription>
              An active subscription is required to generate practice plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.status === "unset" && (
              <p className="text-sm text-muted-foreground">
                Please link your Shopify account to get started.
              </p>
            )}
            {(subscription?.status === "expired" ||
              subscription?.status === "cancelled") && (
              <p className="text-sm text-muted-foreground">
                Your subscription has expired or been cancelled. Please renew to
                continue using this feature.
              </p>
            )}
            <Button variant="outline">Manage Subscription</Button>
          </CardContent>
        </Card>
      )}

      <div className={hasAccess ? "" : "pointer-events-none opacity-50"}>
        <PlannerForm />
      </div>
    </div>
  );
}
