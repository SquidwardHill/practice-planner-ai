import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase/server";

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
 * Extract customer ID and email from native Shopify webhook payload
 */
function extractCustomerInfo(payload: any): {
  customerId: string | null;
  email: string | null;
} {
  // Native Shopify webhooks have customer info at the root level
  if (payload.customer) {
    return {
      customerId: payload.customer.id ? String(payload.customer.id) : null,
      email: payload.customer.email || null,
    };
  }

  // Orders webhook has customer info nested
  if (payload.customer_id) {
    return {
      customerId: String(payload.customer_id),
      email: payload.email || null,
    };
  }

  return { customerId: null, email: null };
}

/**
 * Determine subscription status from order webhook
 * For native Shopify, check if order contains subscription product
 */
function getSubscriptionStatusFromOrder(payload: any): {
  status: string;
  startDate?: Date;
  endDate?: Date;
} {
  // If this is an order webhook, check if it's a subscription purchase
  if (payload.line_items) {
    // Check if any line item is a subscription product
    const hasSubscription = payload.line_items.some((item: any) => {
      // TODO:Adjust this check based on how you identify subscription products
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

      return {
        status: payload.financial_status === "paid" ? "active" : "pending",
        startDate: orderDate,
        endDate: endDate,
      };
    }
  }

  // Default: no subscription found
  return { status: "trial" };
}

/**
 * Update user profile with subscription information
 */
async function updateUserSubscription(
  shopifyCustomerId: string,
  subscriptionData: {
    status: string;
    startDate?: Date;
    endDate?: Date;
  },
  email?: string
) {
  try {
    // Find profile by shopify_customer_id
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
    const { customerId, email } = extractCustomerInfo(payload);

    if (!customerId) {
      console.warn("Could not extract customer ID from webhook payload");
      return NextResponse.json(
        { error: "Customer ID not found in payload" },
        { status: 400 }
      );
    }

    // Determine subscription status based on webhook topic
    let subscriptionData: {
      status: string;
      startDate?: Date;
      endDate?: Date;
    };

    if (topic === "orders/paid" || topic === "orders/create") {
      subscriptionData = getSubscriptionStatusFromOrder(payload);
    } else if (topic === "orders/cancelled") {
      subscriptionData = {
        status: "cancelled",
        endDate: new Date(),
      };
    } else {
      // Need to verify subscription via API for customer webhooks
      // For now, just store the customer ID and email
      subscriptionData = {
        status: "trial", // Will be verified when user signs up
      };
    }

    // Update user profile with subscription information
    const result = await updateUserSubscription(
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
