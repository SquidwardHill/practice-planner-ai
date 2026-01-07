import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";

import { SubscriptionStatusBadge } from "@/components/atoms/subscription-status-badge";
import { SubscriptionStatus } from "@/lib/types/subscription";
import { H1, P, Small } from "@/components/atoms/typography";
import { ShopifyLinkAccount } from "@/components/organisms/shopify-link-account";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_NAME } from "@/lib/config/branding";
import { InfoField } from "@/components/molecules/info-field";
import { InfoSection } from "@/components/molecules/info-section";

export default async function ProfilePage() {
  const { user, subscription } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12">
        <H1>Profile</H1>
        <P className="text-muted-foreground mt-1 text-lg">
          Manage your account and subscription settings
        </P>
      </div>

      <div className="space-y-6">
        <InfoSection
          title="Account Information"
          description={`Your ${PRODUCT_NAME} account details`}
        >
          <InfoField label="Email" value={user.email || "Not set"} />
          <InfoField
            label="User ID"
            value={<Small className="font-mono">{user.id}</Small>}
            labelClassName="text-muted-foreground"
          />
        </InfoSection>

        <InfoSection
          title="Subscription Status"
          showHeaderBorder={true}
          description={`Subscriptions are managed through the ${
            process.env.SHOPIFY_STORE_DOMAIN || "HoopsKing.com"
          } Shopify store`}
        >
          <InfoField
            label="Status"
            value={<SubscriptionStatusBadge status={subscription?.status} />}
            labelClassName="text-muted-foreground"
          />
          <InfoField
            label="Shopify Account Linked"
            value={
              subscription?.hasLinkedAccount ? (
                <Badge
                  variant="default"
                  className="inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Linked</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  <span>Not Linked</span>
                </Badge>
              )
            }
            labelClassName="text-muted-foreground"
          />
          {subscription?.isValid && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <Small className="text-muted-foreground">
                You have access to all features
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
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <Small>
                  No subscription found. Please link your Shopify account to get
                  started.
                </Small>
              </div>
              {!subscription?.hasLinkedAccount && (
                <ShopifyLinkAccount
                  userEmail={user.email}
                  showEmailInput={true}
                  buttonVariant="default"
                />
              )}
            </div>
          )}
        </InfoSection>
      </div>
    </div>
  );
}
