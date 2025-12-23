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


const SUBSCRIPTION_ROUTES = ["/planner"];


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
  const isSubscriptionRoute = matchesRoute(pathname, SUBSCRIPTION_ROUTES);

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

  if (user && isSubscriptionRoute) {
    const subscription = await getSubscriptionStatus(supabase, user.id);

    response.headers.set("X-Subscription-Status", subscription.status);
    response.headers.set(
      "X-Has-Subscription",
      subscription.isValid ? "true" : "false"
    );
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
