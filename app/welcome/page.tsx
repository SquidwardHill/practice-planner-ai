import { getAuthState } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { isValidSubscription } from "@/lib/types/subscription";
import { FeatureGrid } from "@/components/organisms/feature-grid";
import { allFeatures } from "@/lib/data/features";
import { welcomeBenefits } from "@/lib/data/benefits";
import { BenefitsSection } from "@/components/molecules/benefits-section";
import { ShopifyLinkAccount } from "@/components/organisms/shopify-link-account";

export default async function WelcomePage() {
  const { user, subscription } = await getAuthState();

  const hasAccess =
    user && subscription && isValidSubscription(subscription.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          {hasAccess
            ? "Welcome to Practice Planner AI"
            : "Unlock Your Coaching Potential"}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {hasAccess
            ? "Your AI-powered assistant for creating structured basketball practice plans. Get started by exploring the features below."
            : "Get access to AI-powered practice planning, drill library management, and more. Start your free trial today."}
        </p>
      </div>

      <FeatureGrid
        features={allFeatures}
        hasAccess={hasAccess ?? false}
        buttonText="Get Started"
        disabledButtonText="Unlock Access"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Why Practice Planner AI?</CardTitle>
            <CardDescription>
              Discover how this tool can transform your coaching workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BenefitsSection benefits={welcomeBenefits} variant="welcome" />
            {!hasAccess && (
              <div className="pt-4 border-t space-y-4">
                {!subscription?.hasLinkedAccount && user && (
                  <ShopifyLinkAccount
                    userEmail={user.email}
                    showEmailInput={true}
                    buttonVariant="default"
                    buttonSize="lg"
                  />
                )}
                {subscription?.hasLinkedAccount && (
                  <Link href="/profile">
                    <Button variant="outline" className="w-full">
                      Get Started with Free Trial
                    </Button>
                  </Link>
                )}
              </div>
            )}
            {hasAccess && (
              <div className="pt-4">
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Go to Home
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="aspect-video bg-muted flex items-center justify-center">
            <div className="text-center p-8">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-base text-muted-foreground">
                Graphic placeholder
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
