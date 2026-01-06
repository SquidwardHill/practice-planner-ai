"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeUserAccess, type UserAccess } from "@/lib/types/access-control";
import {
  SubscriptionStatus,
  type SubscriptionStatusType,
} from "@/lib/types/subscription";

interface UserAccessContextType {
  access: UserAccess;
  isLoading: boolean;
  // Convenience properties
  hasAccess: boolean;
  isAuthenticated: boolean;
  subscriptionStatus: SubscriptionStatusType;
  isTrial: boolean;
  isActive: boolean;
  hasLinkedShopifyAccount: boolean;
}

const UserAccessContext = createContext<UserAccessContextType | undefined>(
  undefined
);

export function UserAccessProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<UserAccess>({
    isAuthenticated: false,
    subscriptionStatus: SubscriptionStatus.UNSET,
    hasLinkedShopifyAccount: false,
    hasAccess: false,
    isTrial: false,
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAccess() {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAccess({
          isAuthenticated: false,
          subscriptionStatus: SubscriptionStatus.UNSET,
          hasLinkedShopifyAccount: false,
          hasAccess: false,
          isTrial: false,
          isActive: false,
        });
        setIsLoading(false);
        return;
      }

      // Get profile to check subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, shopify_customer_id")
        .eq("id", user.id)
        .single();

      const subscriptionStatus =
        (profile?.subscription_status as SubscriptionStatusType) ||
        SubscriptionStatus.UNSET;
      const hasLinkedShopifyAccount = !!profile?.shopify_customer_id;

      const userAccess = computeUserAccess(
        true,
        subscriptionStatus,
        hasLinkedShopifyAccount
      );

      setAccess(userAccess);
      setIsLoading(false);
    }

    fetchAccess();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAccess({
          isAuthenticated: false,
          subscriptionStatus: SubscriptionStatus.UNSET,
          hasLinkedShopifyAccount: false,
          hasAccess: false,
          isTrial: false,
          isActive: false,
        });
        setIsLoading(false);
      } else {
        fetchAccess();
      }
    });

    // Listen for custom refresh events (e.g., from dev user switcher)
    const handleRefresh = () => {
      fetchAccess();
    };
    window.addEventListener("user-access-refresh", handleRefresh);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("user-access-refresh", handleRefresh);
    };
  }, []);

  return (
    <UserAccessContext.Provider
      value={{
        access,
        isLoading,
        hasAccess: access.hasAccess,
        isAuthenticated: access.isAuthenticated,
        subscriptionStatus: access.subscriptionStatus,
        isTrial: access.isTrial,
        isActive: access.isActive,
        hasLinkedShopifyAccount: access.hasLinkedShopifyAccount,
      }}
    >
      {children}
    </UserAccessContext.Provider>
  );
}

export function useUserAccess() {
  const context = useContext(UserAccessContext);
  if (context === undefined) {
    throw new Error("useUserAccess must be used within a UserAccessProvider");
  }
  return context;
}
