import { createClient } from "./server";
import {
  SubscriptionStatus,
  type SubscriptionStatusType,
} from "@/lib/types/subscription";
import {
  computeUserAccess,
  type UserAccess,
} from "@/lib/types/access-control";

export interface AuthState {
  user: {
    id: string;
    email?: string;
    created_at?: string;
    full_name?: string | null;
  } | null;
  subscription: {
    status: SubscriptionStatusType;
    isValid: boolean;
    isTrial: boolean;
    hasLinkedAccount: boolean;
  } | null;
  // New: Simplified access control state
  access: UserAccess;
}

/**
 * Get current user and subscription status for server components
 */
export async function getAuthState(): Promise<AuthState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Handle refresh token errors gracefully
  // "Invalid Refresh Token: Already Used" can happen with concurrent requests
  if (authError) {
    // If it's a refresh token error, treat as unauthenticated
    if (
      authError.message?.includes("Invalid Refresh Token") ||
      authError.message?.includes("refresh_token") ||
      authError.status === 401
    ) {
      return {
        user: null,
        subscription: null,
        access: computeUserAccess(false, SubscriptionStatus.UNSET, false),
      };
    }
    // For other errors, also return unauthenticated state
    return {
      user: null,
      subscription: null,
      access: computeUserAccess(false, SubscriptionStatus.UNSET, false),
    };
  }

  if (!user) {
    return {
      user: null,
      subscription: null,
      access: computeUserAccess(false, SubscriptionStatus.UNSET, false),
    };
  }

  // Get user's profile to check subscription status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_status, shopify_customer_id, full_name")
    .eq("id", user.id)
    .single();

  // If no profile or no Shopify account linked, user doesn't have access
  if (profileError || !profile || !profile.shopify_customer_id) {
    return {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        full_name: profile?.full_name || null,
      },
      subscription: {
        status: SubscriptionStatus.UNSET,
        isValid: false,
        isTrial: false,
        hasLinkedAccount: false,
      },
      access: computeUserAccess(true, SubscriptionStatus.UNSET, false),
    };
  }

  const status =
    (profile.subscription_status as SubscriptionStatusType) ||
    SubscriptionStatus.UNSET;

  const isValid =
    status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL;
  const isTrial = status === SubscriptionStatus.TRIAL;

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      full_name: profile.full_name || null,
    },
    subscription: {
      status,
      isValid,
      isTrial,
      hasLinkedAccount: true,
    },
    access: computeUserAccess(true, status, true),
  };
}
