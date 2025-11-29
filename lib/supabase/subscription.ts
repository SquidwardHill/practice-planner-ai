// Subscription and access control helpers
// These functions help manage Shopify subscription integration

import { getProfile, hasActiveAccess } from "./queries";
import type { SubscriptionStatus } from "./database.types";

/**
 * Check if a user has active access (subscription or valid trial)
 * Use this in API routes and server components to gate features
 */
export async function checkUserAccess(userId: string): Promise<{
  hasAccess: boolean;
  status: SubscriptionStatus | null;
  message?: string;
}> {
  const profile = await getProfile(userId);

  if (!profile) {
    return {
      hasAccess: false,
      status: null,
      message: "User profile not found",
    };
  }

  const now = new Date();
  const hasAccess = await hasActiveAccess(userId);

  // Provide specific messages based on status
  if (profile.subscription_status === "active") {
    if (profile.subscription_end_date) {
      const endDate = new Date(profile.subscription_end_date);
      if (endDate <= now) {
        return {
          hasAccess: false,
          status: "expired",
          message: "Your subscription has expired",
        };
      }
    }
    return {
      hasAccess: true,
      status: "active",
    };
  }

  if (profile.subscription_status === "trial") {
    if (profile.trial_end_date) {
      const trialEnd = new Date(profile.trial_end_date);
      if (trialEnd <= now) {
        return {
          hasAccess: false,
          status: "expired",
          message: "Your trial has expired",
        };
      }
      const daysRemaining = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        hasAccess: true,
        status: "trial",
        message: `${daysRemaining} days remaining in trial`,
      };
    }
    return {
      hasAccess: true,
      status: "trial",
    };
  }

  if (profile.subscription_status === "cancelled") {
    // Check if they still have time left on their subscription
    if (profile.subscription_end_date) {
      const endDate = new Date(profile.subscription_end_date);
      if (endDate > now) {
        return {
          hasAccess: true,
          status: "cancelled",
          message: "Subscription cancelled but still active until end date",
        };
      }
    }
    return {
      hasAccess: false,
      status: "cancelled",
      message: "Your subscription has been cancelled",
    };
  }

  return {
    hasAccess: false,
    status: profile.subscription_status,
    message: "No active subscription or trial",
  };
}

/**
 * Get subscription details for display
 */
export async function getSubscriptionDetails(userId: string) {
  const profile = await getProfile(userId);

  if (!profile) {
    return null;
  }

  const now = new Date();
  const access = await checkUserAccess(userId);

  return {
    status: profile.subscription_status,
    hasAccess: access.hasAccess,
    message: access.message,
    trialEndDate: profile.trial_end_date,
    subscriptionEndDate: profile.subscription_end_date,
    shopifyCustomerId: profile.shopify_customer_id,
    isTrial: profile.subscription_status === "trial",
    isActive: profile.subscription_status === "active",
    isCancelled: profile.subscription_status === "cancelled",
    isExpired: profile.subscription_status === "expired" || !access.hasAccess,
  };
}

/**
 * Helper to use in API routes for access control
 * Throws an error if user doesn't have access
 */
export async function requireAccess(userId: string): Promise<void> {
  const access = await checkUserAccess(userId);

  if (!access.hasAccess) {
    throw new Error(
      access.message || "Access denied. Please subscribe or start a trial."
    );
  }
}
