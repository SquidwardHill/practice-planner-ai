"use client";

/**
 * Access Control Components
 *
 * Simple model: Users either have access to the app (authenticated + subscribed)
 * or they see marketing/preview content.
 */

import { ReactNode } from "react";
import { useUserAccess } from "@/hooks/useUserAccess";
import Link from "next/link";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";
import { H2, H3, P, Small } from "@/components/atoms/typography";

// Get Shopify subscription URL from environment
const SHOPIFY_SUBSCRIPTION_URL =
  process.env.NEXT_PUBLIC_SHOPIFY_SUBSCRIPTION_URL || "https://hoopsking.com";

// ============================================================================
// GUARD COMPONENTS
// ============================================================================

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Show content only if user is authenticated
 * Use this for pages that need a logged-in user (like account settings)
 */
export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useUserAccess();

  if (isLoading) return null;
  if (!isAuthenticated) return <>{fallback}</>;

  return <>{children}</>;
}

interface RequireAccessProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Show content only if user has full access (authenticated + subscribed)
 * Use this for all actual app features
 *
 * Without access, show the fallback (typically an upgrade/subscribe prompt)
 */
export function RequireAccess({
  children,
  fallback = null,
}: RequireAccessProps) {
  const { hasAccess, isLoading } = useUserAccess();

  // Show nothing while loading to prevent flash
  if (isLoading) return null;

  if (!hasAccess) return <>{fallback}</>;

  return <>{children}</>;
}

// ============================================================================
// CONDITIONAL CONTENT BASED ON ACCESS STATE
// ============================================================================

interface AccessSwitchProps {
  /** User is not logged in */
  unauthenticated?: ReactNode;
  /** User is logged in but no subscription */
  noSubscription?: ReactNode;
  /** User has active subscription */
  active?: ReactNode;
  /** User has trial subscription */
  trial?: ReactNode;
  /** Loading state */
  loading?: ReactNode;
}

/**
 * Render different content based on user's access state
 * Perfect for hero sections, CTAs, and messaging that changes based on user status
 */
export function AccessSwitch({
  unauthenticated,
  noSubscription,
  active,
  trial,
  loading,
}: AccessSwitchProps) {
  const { isAuthenticated, hasAccess, isTrial, isActive, isLoading } =
    useUserAccess();

  if (isLoading && loading) return <>{loading}</>;

  // Not authenticated - show signup/login CTA
  if (!isAuthenticated && unauthenticated) {
    return <>{unauthenticated}</>;
  }

  // Authenticated but no access - show subscribe CTA
  if (isAuthenticated && !hasAccess && noSubscription) {
    return <>{noSubscription}</>;
  }

  // Has access - show appropriate content based on subscription type
  if (hasAccess) {
    if (isTrial && trial) return <>{trial}</>;
    if (isActive && active) return <>{active}</>;
  }

  return null;
}

interface AppFeatureProps {
  children: ReactNode;
  subscribePrompt?: ReactNode;
}

/**
 * Wrap any app feature to show subscribe prompt if user doesn't have access
 * This is your main wrapper for planner, library, etc.
 */
export function AppFeature({ children, subscribePrompt }: AppFeatureProps) {
  const { hasAccess, isAuthenticated, isLoading } = useUserAccess();

  // Show nothing while loading to prevent flash of unauthorized state
  if (isLoading) {
    return null;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // No access - show subscribe prompt
  return (
    <div className="app-feature-locked">
      {subscribePrompt || (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-8 text-center">
          <div className="space-y-2">
            <H2>
              Subscribe to Access This Feature
            </H2>
            <P className="text-muted-foreground max-w-md">
              {isAuthenticated
                ? "Get full access to all features with a subscription"
                : "Sign up and subscribe to unlock all features"}
            </P>
          </div>
          <div className="flex gap-4">
            {!isAuthenticated && (
              <Link href="/auth/signup">
                <Button size="default">Sign Up</Button>
              </Link>
            )}
            <a
              href={SHOPIFY_SUBSCRIPTION_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant={isAuthenticated ? "default" : "outline"} size="default">
                View Plans
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

interface MarketingWrapperProps {
  children: ReactNode;
  preview?: ReactNode;
}

/**
 * Show full content if user has access, otherwise show a preview/teaser
 * Use this to let users see what features exist without being able to use them
 */
export function MarketingWrapper({ children, preview }: MarketingWrapperProps) {
  const { hasAccess } = useUserAccess();

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show preview/marketing version
  return (
    <div className="feature-preview relative">
      {preview || (
        <>
          <div className="preview-content opacity-50 pointer-events-none blur-sm">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-6 space-y-4 text-center max-w-md">
              <H3>Subscribe to Unlock</H3>
              <Small>
                Get full access to all features with a free trial
              </Small>
              <a
                href={SHOPIFY_SUBSCRIPTION_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="default">
                  Start Free Trial
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
