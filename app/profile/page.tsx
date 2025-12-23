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

export default async function ProfilePage() {
  const { user, subscription } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and subscription settings
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm mt-1">{user.email || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                User ID
              </label>
              <p className="text-sm mt-1 font-mono">{user.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Your current subscription information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <p className="text-sm mt-1">
                {subscription?.hasLinkedAccount ? "Yes" : "No"}
              </p>
            </div>
            {subscription?.isValid && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ You have access to all features
                </p>
              </div>
            )}
            {!subscription?.isValid &&
              subscription?.status !== SubscriptionStatus.UNSET && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your subscription is not active. Please renew to access all
                    features.
                  </p>
                </div>
              )}
            {subscription?.status === SubscriptionStatus.UNSET && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  No subscription found. Please link your Shopify account to get
                  started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
