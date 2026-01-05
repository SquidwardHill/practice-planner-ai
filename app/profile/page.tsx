import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionStatusBadge } from "@/components/subscription-status-badge";
import { SubscriptionStatus } from "@/lib/types/subscription";
import { H1, H3, P, Small } from "@/components/typography";

export default async function ProfilePage() {
  const { user, subscription } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12">
        <H1>Profile</H1>
        <P className="text-muted-foreground mt-1">
          Manage your account and subscription settings
        </P>
      </div>

      <div className="space-y-6">
        <div className="p-6 border rounded-lg">
          <H3 className="mb-1">Account Information</H3>
          <Small className="text-muted-foreground mb-4">
            Your account details
          </Small>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <P className="mt-1">{user.email || "Not set"}</P>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                User ID
              </label>
              <Small className="mt-1 font-mono">{user.id}</Small>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <H3 className="mb-1">Subscription Status</H3>
          <Small className="text-muted-foreground mb-4">
            Your current subscription information
          </Small>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                <SubscriptionStatusBadge status={subscription?.status} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Shopify Account Linked
              </label>
              <P className="mt-1">
                {subscription?.hasLinkedAccount ? "Yes" : "No"}
              </P>
            </div>
            {subscription?.isValid && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <Small>
                  ✓ You have access to all features
                </Small>
              </div>
            )}
            {!subscription?.isValid &&
              subscription?.status !== SubscriptionStatus.UNSET && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <Small>
                    Your subscription is not active. Please renew to access all
                    features.
                  </Small>
                </div>
              )}
            {subscription?.status === SubscriptionStatus.UNSET && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <Small>
                  No subscription found. Please link your Shopify account to get
                  started.
                </Small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
