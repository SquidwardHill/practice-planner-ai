/**
 * Shopify Webhook Types
 */
import { type SubscriptionStatusType } from "@/lib/types";

export interface ShopifyWebhookHeaders {
  "x-shopify-hmac-sha256": string;
  "x-shopify-topic": string;
  "x-shopify-shop-domain": string;
  "x-shopify-api-version"?: string;
}

export interface ShopifyCustomer {
  id: number | string;
  email?: string;
  first_name?: string;
  last_name?: string;
  customer_id?: number | string;
  subscriptions?: ShopifySubscription[];
}

export interface ShopifySubscription {
  id: number | string;
  customer_id: number | string;
  status: "active" | "cancelled" | "expired" | "trial" | "pending";
  created_at?: string;
  updated_at?: string;
  cancelled_at?: string;
  ends_at?: string;
  billing_interval_unit?: "day" | "week" | "month" | "year";
  billing_interval_count?: number;
}

export interface ShopifyWebhookPayload {
  id?: number | string;
  topic?: string;
  customer?: ShopifyCustomer;
  customer_id?: number | string;
  subscription?: ShopifySubscription;
  email?: string;
  [key: string]: any; // Allow additional fields from different subscription apps
}

export interface SubscriptionUpdateData {
  status: SubscriptionStatusType;
  startDate?: Date;
  endDate?: Date;
}
