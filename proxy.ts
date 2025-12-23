import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import {
  SubscriptionStatus,
  isValidSubscription,
  isTrialSubscription,
  type SubscriptionStatusType,
} from "@/lib/types";

/**
 * Auth protected routes
 */
const PROTECTED_ROUTES = ["/planner", "/library", "/account"];

/**
 * Premium routes that require Shopify subscription (active or trial)
 * Users must have either an active subscription or a Shopify trial
 */
const PREMIUM_ROUTES = ["/planner"];

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/api", // API routes are handled separately
];

/**
 * Check if a path matches any route pattern
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

/**
 * Get subscription status from profile
 *
 * Valid subscriptions: "active" (paid) or "trial" (Shopify trial)
 * Invalid subscriptions: "expired", "cancelled", "unset", or no profile/link
 */
async function getSubscriptionStatus(
  supabase: any,
  userId: string
): Promise<{
  status: SubscriptionStatusType;
  isValid: boolean; // true if active or trial (valid Shopify subscription)
  isTrial: boolean;
  hasLinkedAccount: boolean;
}> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status, shopify_customer_id")
    .eq("id", userId)
    .single();

  // If no profile or no Shopify account linked, user doesn't have access
  if (error || !profile || !profile.shopify_customer_id) {
    return {
      status: SubscriptionStatus.UNSET,
      isValid: false,
      isTrial: false,
      hasLinkedAccount: false,
    };
  }

  const status =
    (profile.subscription_status as SubscriptionStatusType) ||
    SubscriptionStatus.UNSET; // Default to unset if status is missing
  const isValid = isValidSubscription(status);
  const isTrial = isTrialSubscription(status);

  return {
    status,
    isValid,
    isTrial,
    hasLinkedAccount: true,
  };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  const { supabase, response } = createMiddlewareClient(request);

  // Get user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Check if route requires authentication
  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
  const isPremiumRoute = matchesRoute(pathname, PREMIUM_ROUTES);

  // If route is protected and user is not authenticated, redirect to login
  if (isProtectedRoute && (!user || authError)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access login/signup, redirect to home
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check subscription status for premium routes
  if (user && isPremiumRoute) {
    const subscription = await getSubscriptionStatus(supabase, user.id);

    // If user hasn't linked their Shopify account, redirect to account page to link
    if (!subscription.hasLinkedAccount) {
      const redirectUrl = new URL("/account", request.url);
      redirectUrl.searchParams.set("link", "required");
      return NextResponse.redirect(redirectUrl);
    }

    // If subscription is invalid (expired or cancelled), redirect to account/subscription page
    if (!subscription.isValid) {
      const redirectUrl = new URL("/account", request.url);
      redirectUrl.searchParams.set("subscription", subscription.status);
      return NextResponse.redirect(redirectUrl);
    }

    // Valid subscription (active or trial) - allow access
    // Add header so frontend can show appropriate UI (trial banner, etc.)
    response.headers.set("X-Subscription-Status", subscription.status);
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
