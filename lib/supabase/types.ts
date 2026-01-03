// Simple database types
import { type SubscriptionStatusType, type Drill } from "@/lib/types";

export type { SubscriptionStatusType as SubscriptionStatus } from "@/lib/types";
export type { Drill } from "@/lib/types";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  shopify_customer_id: string | null;
  subscription_status: SubscriptionStatusType;
  trial_end_date: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

