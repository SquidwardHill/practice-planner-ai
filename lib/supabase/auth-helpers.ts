import { createClient } from "./server";
import {
  SubscriptionStatus,
  type SubscriptionStatusType,
} from "@/lib/types/subscription";

export interface AuthState {
  user: {
    id: string;
    email?: string;
  } | null;
  subscription: {
    status: SubscriptionStatusType;
    isValid: boolean;
    isTrial: boolean;
    hasLinkedAccount: boolean;
  } | null;
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

  if (authError || !user) {
    return {
      user: null,
      subscription: null,
    };
  }

  // Get user's profile to check subscription status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_status, shopify_customer_id")
    .eq("id", user.id)
    .single();

  // If no profile or no Shopify account linked, user doesn't have access
  if (profileError || !profile || !profile.shopify_customer_id) {
    return {
      user: {
        id: user.id,
        email: user.email,
      },
      subscription: {
        status: SubscriptionStatus.UNSET,
        isValid: false,
        isTrial: false,
        hasLinkedAccount: false,
      },
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
    },
    subscription: {
      status,
      isValid,
      isTrial,
      hasLinkedAccount: true,
    },
  };
}
