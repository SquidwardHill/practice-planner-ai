/**
 * Shopify API Client
 * Helper functions for making Shopify Admin API calls
 */

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";

if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
  console.warn(
    "Shopify credentials not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN"
  );
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyOrder {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  financial_status: string;
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    variant_title?: string;
    sku?: string;
    product_type?: string;
    properties?: Array<{ name: string; value: string }>;
  }>;
}

/**
 * Search for a customer by email
 */
export async function findCustomerByEmail(
  email: string
): Promise<ShopifyCustomer | null> {
  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Shopify credentials not configured");
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
      email
    )}`,
    {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error: ${errorText}`);
  }

  const data = await response.json();
  const customers = data.customers || [];

  return customers.length > 0 ? customers[0] : null;
}

/**
 * Get customer by ID
 */
export async function getCustomerById(
  customerId: string | number
): Promise<ShopifyCustomer | null> {
  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Shopify credentials not configured");
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/${customerId}.json`,
    {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(`Shopify API error: ${errorText}`);
  }

  const data = await response.json();
  return data.customer || null;
}

/**
 * Get customer's orders
 */
export async function getCustomerOrders(
  customerId: string | number,
  limit: number = 10
): Promise<ShopifyOrder[]> {
  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error("Shopify credentials not configured");
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/${customerId}/orders.json?status=any&limit=${limit}`,
    {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error: ${errorText}`);
  }

  const data = await response.json();
  return data.orders || [];
}

/**
 * Check if an order contains subscription products
 */
export function isSubscriptionOrder(order: ShopifyOrder): boolean {
  return order.line_items.some((item) => {
    return (
      item.product_type === "subscription" ||
      item.sku?.includes("subscription") ||
      item.variant_title?.toLowerCase().includes("subscription") ||
      item.properties?.some((p) => p.name === "subscription")
    );
  });
}

import { SubscriptionStatus, type SubscriptionStatusType } from "@/lib/types";

/**
 * Extract subscription information from orders
 */
export function getSubscriptionFromOrders(orders: ShopifyOrder[]): {
  status: SubscriptionStatusType;
  startDate?: Date;
  endDate?: Date;
} {
  // Find the most recent paid order with a subscription product
  const subscriptionOrder = orders
    .filter((order) => order.financial_status === "paid")
    .find(isSubscriptionOrder);

  if (!subscriptionOrder) {
    return { status: SubscriptionStatus.UNSET };
  }

  const startDate = new Date(subscriptionOrder.created_at);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

  let status: SubscriptionStatusType = SubscriptionStatus.ACTIVE;

  // Check if subscription has expired
  if (endDate < new Date()) {
    status = SubscriptionStatus.EXPIRED;
  }

  // Check if order was cancelled
  if (subscriptionOrder.cancelled_at) {
    status = SubscriptionStatus.CANCELLED;
    const cancelledDate = new Date(subscriptionOrder.cancelled_at);
    return {
      status,
      startDate,
      endDate: cancelledDate,
    };
  }

  return {
    status,
    startDate,
    endDate,
  };
}
