/**
 * Access Control Types
 *
 * This file defines the core concepts for controlling user access throughout the app:
 * - Authentication: Is the user logged in?
 * - Authorization: Does the user have an active subscription?
 *
 * Simple model: You need BOTH authentication AND a valid subscription to use the app.
 * Without a subscription, the site is just a marketing page showing what's available.
 */

import { SubscriptionStatus, type SubscriptionStatusType } from "./subscription";

// ============================================================================
// ACCESS STATE
// ============================================================================

/**
 * Complete access control state for a user
 *
 * The key property is `hasAccess` - this determines if they can use the app.
 * Without access, they see marketing/preview content only.
 */
export interface UserAccess {
  // Authentication
  isAuthenticated: boolean;

  // Authorization
  subscriptionStatus: SubscriptionStatusType;
  hasLinkedShopifyAccount: boolean;

  // THE KEY PERMISSION: Can they actually use the app?
  hasAccess: boolean; // true only if: authenticated + hasLinkedShopifyAccount + (active OR trial)

  // Context for displaying appropriate messaging
  isTrial: boolean;
  isActive: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Does this subscription status grant access to the app?
 * Only ACTIVE and TRIAL subscriptions grant access.
 */
export function hasValidSubscription(status: SubscriptionStatusType): boolean {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL;
}

export function isTrialSubscription(status: SubscriptionStatusType): boolean {
  return status === SubscriptionStatus.TRIAL;
}

export function isActiveSubscription(status: SubscriptionStatusType): boolean {
  return status === SubscriptionStatus.ACTIVE;
}

/**
 * Compute user's complete access state
 *
 * Access is granted ONLY when:
 * 1. User is authenticated AND
 * 2. User has linked Shopify account AND
 * 3. Subscription status is ACTIVE or TRIAL
 */
export function computeUserAccess(
  isAuthenticated: boolean,
  subscriptionStatus: SubscriptionStatusType,
  hasLinkedShopifyAccount: boolean
): UserAccess {
  const isTrial = isTrialSubscription(subscriptionStatus);
  const isActive = isActiveSubscription(subscriptionStatus);

  // The golden rule: must be authenticated with a valid subscription
  const hasAccess =
    isAuthenticated &&
    hasLinkedShopifyAccount &&
    hasValidSubscription(subscriptionStatus);

  return {
    isAuthenticated,
    subscriptionStatus,
    hasLinkedShopifyAccount,
    hasAccess,
    isTrial,
    isActive,
  };
}
