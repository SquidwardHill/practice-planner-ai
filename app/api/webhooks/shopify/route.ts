import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionStatus, type SubscriptionStatusType } from "@/lib/types";

// Use Node.js runtime for crypto operations (not Edge)
export const runtime = "nodejs";

// Maximum request body size for webhooks (Shopify can send large payloads)
export const maxDuration = 30;

/**
 * Verify Shopify webhook signature
 * @param body - Raw request body as string
 * @param signature - X-Shopify-Hmac-Sha256 header value
 * @param secret - Shopify webhook secret from environment
 * @returns boolean indicating if signature is valid
 */
function verifyShopifyWebhook(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body, "utf8");
    const calculatedHash = hmac.digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedHash)
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

/**
 Extract customer ID and email from native Shopify webhook payload
 Shopify webhook payloads vary by topic: 
 —> customers/create, customers/update: customer object IS the payload (id, email at root level)—> orders/*: customer_id and email at root level
  */
function extractCustomerInfo(
  payload: any,
  topic?: string
): {
  customerId: string | null;
  email: string | null;
} {
  // For customers/create and customers/update webhooks, the payload IS the customer object
  if (topic?.startsWith("customers/")) {
    if (payload.id) {
      return {
        customerId: String(payload.id),
        email: payload.email || null,
      };
    }
  }

  // For customer webhooks with nested customer object (some formats)
  if (payload.customer) {
    return {
      customerId: payload.customer.id ? String(payload.customer.id) : null,
      email: payload.customer.email || null,
    };
  }

  // For orders webhooks, customer info is at root level
  if (payload.customer_id) {
    return {
      customerId: String(payload.customer_id),
      email: payload.email || null,
    };
  }

  // Fallback: check if payload has id and looks like customer data
  if (
    payload.id &&
    (payload.email || payload.first_name || payload.last_name)
  ) {
    return {
      customerId: String(payload.id),
      email: payload.email || null,
    };
  }

  return { customerId: null, email: null };
}

/**
 * Determine subscription status from order webhook
 */
function getSubscriptionStatusFromOrder(payload: any): {
  status: SubscriptionStatusType | "pending";
  // Pending status is ephemeral (no DB storage)
  startDate?: Date;
  endDate?: Date;
} {
  if (payload.line_items) {
    const hasSubscription = payload.line_items.some((item: any) => {
      // 🔌 TODO: Adjust condition per published Shopifysubscription properties
      return (
        item.product_type === "subscription" ||
        item.sku?.includes("subscription") ||
        item.properties?.some((p: any) => p.name === "subscription")
      );
    });

    if (hasSubscription) {
      const orderDate = payload.created_at
        ? new Date(payload.created_at)
        : new Date();
      // Calculate end date based on subscription period (1 year)
      const endDate = new Date(orderDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

      // If not paid yet, return "pending" (will be updated when order is paid)
      if (payload.financial_status !== "paid") {
        return {
          status: "pending",
          startDate: orderDate,
          endDate: endDate,
        };
      }

      return {
        status: SubscriptionStatus.ACTIVE,
        startDate: orderDate,
        endDate: endDate,
      };
    }
  }

  // Default: no subscription found
  return { status: SubscriptionStatus.UNSET };
}

/**
 * Update user profile with subscription information
 */
async function updateUserSubscription(
  supabase: any,
  shopifyCustomerId: string,
  subscriptionData: {
    status: SubscriptionStatusType;
    startDate?: Date;
    endDate?: Date;
  },
  email?: string
) {
  try {
    const { data: existingProfile, error: findError } = await supabase
      .from("profiles")
      .select("id")
      .eq("shopify_customer_id", shopifyCustomerId)
      .single();

    if (findError && findError.code !== "PGRST116") {
      // PGRST116 = "not found"
      console.error("Error finding profile:", findError);
      return { success: false, error: findError };
    }

    const updateData: any = {
      shopify_customer_id: shopifyCustomerId,
      subscription_status: subscriptionData.status,
      updated_at: new Date().toISOString(),
    };

    if (subscriptionData.startDate) {
      updateData.subscription_start_date =
        subscriptionData.startDate.toISOString();
    }
    if (subscriptionData.endDate) {
      updateData.subscription_end_date = subscriptionData.endDate.toISOString();
    }
    if (email) {
      updateData.email = email;
    }

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", existingProfile.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return { success: false, error: updateError };
      }

      return { success: true, profileId: existingProfile.id };
    } else {
      // Profile doesn't exist yet (if webhook fires before user signs up
      // Log it for manual linking or create a pending record
      console.warn(
        `Profile not found for Shopify customer ID: ${shopifyCustomerId}. User may not have signed up yet.`
      );
      return {
        success: false,
        error: new Error("Profile not found - user may not have signed up yet"),
      };
    }
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return { success: false, error };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("SHOPIFY_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get signature from headers
    const signature = req.headers.get("x-shopify-hmac-sha256");
    const topic = req.headers.get("x-shopify-topic");
    const shop = req.headers.get("x-shopify-shop-domain");

    if (!signature || !topic || !shop) {
      return NextResponse.json(
        { error: "Missing required Shopify headers" },
        { status: 400 }
      );
    }

    // Read raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature
    const isValid = verifyShopifyWebhook(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error("Error parsing webhook payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    console.log(`Received Shopify webhook: ${topic} from ${shop}`);
    console.log("Webhook payload keys:", Object.keys(payload));
    console.log("Payload sample:", JSON.stringify(payload).substring(0, 200));

    // Handle native Shopify webhook topics
    const relevantTopics = [
      "customers/create",
      "customers/update",
      "orders/create",
      "orders/paid",
      "orders/cancelled",
    ];

    if (!relevantTopics.includes(topic)) {
      // Unhandled webhook topic - log it but return success
      console.log(`Unhandled webhook topic: ${topic}`);
      return NextResponse.json({
        success: true,
        message: "Webhook received but not processed",
        topic,
      });
    }

    // Extract customer information
    const { customerId, email } = extractCustomerInfo(payload, topic);

    if (!customerId) {
      console.warn("Could not extract customer ID from webhook payload");
      return NextResponse.json(
        { error: "Customer ID not found in payload" },
        { status: 400 }
      );
    }

    // Determine subscription status based on webhook topic
    let subscriptionData: {
      status: SubscriptionStatusType;
      startDate?: Date;
      endDate?: Date;
    };

    if (topic === "orders/paid" || topic === "orders/create") {
      const orderStatus = getSubscriptionStatusFromOrder(payload);
      // Skip updating for pending orders (will be handled when order is paid)
      if (orderStatus.status === "pending") {
        return NextResponse.json({
          success: true,
          message: "Order pending payment, will update when paid",
        });
      }
      subscriptionData = {
        status: orderStatus.status as SubscriptionStatusType,
        startDate: orderStatus.startDate,
        endDate: orderStatus.endDate,
      };
    } else if (topic === "orders/cancelled") {
      subscriptionData = {
        status: SubscriptionStatus.CANCELLED,
        endDate: new Date(),
      };
    } else {
      // Need to verify subscription via API for customer webhooks
      // For now, just store the customer ID and email
      subscriptionData = {
        status: SubscriptionStatus.UNSET,
      };
    }

    // Create Supabase client for this request
    const supabase = await createClient();

    // Update user profile with subscription information
    const result = await updateUserSubscription(
      supabase,
      customerId,
      subscriptionData,
      email || undefined
    );

    if (result.success) {
      console.log(
        `Successfully updated subscription for customer ${customerId}: ${subscriptionData.status}`
      );
      return NextResponse.json({
        success: true,
        message: "Subscription updated",
        customerId,
        status: subscriptionData.status,
      });
    } else {
      console.error(
        `Failed to update subscription for customer ${customerId}:`,
        result.error
      );
      // Still return 200 to Shopify (don't retry) but log the error
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update subscription",
          message:
            result.error instanceof Error
              ? result.error.message
              : "Unknown error",
        },
        { status: 200 } // Return 200 so Shopify doesn't retry
      );
    }
  } catch (error) {
    console.error("Error processing Shopify webhook:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification during setup)
export async function GET() {
  return NextResponse.json({
    message: "Shopify webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
