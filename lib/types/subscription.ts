/**
 * Shopify Subscription Status Types
 */

/**
 * Subscription status values
 * - active: User has an active paid Shopify subscription
 * - trial: User has an active Shopify subscription trial
 * - expired: User's subscription has expired
 * - cancelled: User's subscription was cancelled
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  TRIAL = "trial",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

/**
 * Type for subscription status string values
 */
export type SubscriptionStatusType =
  | SubscriptionStatus.ACTIVE
  | SubscriptionStatus.TRIAL
  | SubscriptionStatus.EXPIRED
  | SubscriptionStatus.CANCELLED;

/**
 * Check if a subscription status is valid (allows access to premium features)
 * Valid: active or trial
 * Invalid: expired or cancelled
 */
export function isValidSubscription(
  status: string | null | undefined
): boolean {
  if (!status) return false;
  return (
    status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL
  );
}

/**
 * Check if subscription status is a trial
 */
export function isTrialSubscription(
  status: string | null | undefined
): boolean {
  return status === SubscriptionStatus.TRIAL;
}

/**
 * Check if subscription status is active (paid)
 */
export function isActiveSubscription(
  status: string | null | undefined
): boolean {
  return status === SubscriptionStatus.ACTIVE;
}

/**
 * Check if subscription status is invalid (expired or cancelled)
 */
export function isInvalidSubscription(
  status: string | null | undefined
): boolean {
  if (!status) return true;
  return (
    status === SubscriptionStatus.EXPIRED ||
    status === SubscriptionStatus.CANCELLED
  );
}

/**
 * Get default subscription status (used when profile doesn't exist)
 */
export function getDefaultSubscriptionStatus(): SubscriptionStatusType {
  return SubscriptionStatus.TRIAL;
}
