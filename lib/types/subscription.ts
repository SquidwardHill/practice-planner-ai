/**
 * Shopify Subscription Status Types
 */

/**
 * Subscription status values
 * - active: User has an active paid Shopify subscription
 * - trial: User has an active Shopify subscription trial
 * - expired: User's subscription has expired
 * - cancelled: User's subscription was cancelled
 * - unset: User's subscription status is not set (default)
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  TRIAL = "trial",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  UNSET = "unset",
}

export type SubscriptionStatusType =
  | SubscriptionStatus.ACTIVE
  | SubscriptionStatus.TRIAL
  | SubscriptionStatus.EXPIRED
  | SubscriptionStatus.CANCELLED
  | SubscriptionStatus.UNSET;

/**
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

export function isTrialSubscription(
  status: string | null | undefined
): boolean {
  return status === SubscriptionStatus.TRIAL;
}

export function isActiveSubscription(
  status: string | null | undefined
): boolean {
  return status === SubscriptionStatus.ACTIVE;
}

export function isInvalidSubscription(
  status: string | null | undefined
): boolean {
  if (!status) return true;
  return (
    status === SubscriptionStatus.EXPIRED ||
    status === SubscriptionStatus.CANCELLED ||
    status === SubscriptionStatus.UNSET
  );
}

export function getDefaultSubscriptionStatus(): SubscriptionStatusType {
  return SubscriptionStatus.UNSET;
}
