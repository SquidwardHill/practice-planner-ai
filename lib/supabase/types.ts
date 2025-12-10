// Simple database types

export type SubscriptionStatus = "trial" | "active" | "cancelled" | "expired";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  shopify_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  trial_end_date: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

