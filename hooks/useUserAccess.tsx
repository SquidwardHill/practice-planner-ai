/**
 * Hook to get current user's access state
 *
 * This hook provides everything you need to control access throughout the app:
 * - isAuthenticated: Is user logged in?
 * - hasAccess: Can user use the app? (auth + valid subscription)
 * - subscriptionStatus: Active, trial, expired, etc.
 * - isTrial: Is this a trial subscription?
 * - isActive: Is this an active paid subscription?
 *
 * Usage:
 * ```tsx
 * const { hasAccess, isAuthenticated, isTrial } = useUserAccess();
 *
 * if (hasAccess) {
 *   return <PlannerFeature />;
 * }
 *
 * return <SubscribeCTA />;
 * ```
 *
 * Note: This hook uses the UserAccessContext, so it must be used within
 * a UserAccessProvider (which is set up in the root layout).
 */
export { useUserAccess } from "@/contexts/UserAccessContext";
