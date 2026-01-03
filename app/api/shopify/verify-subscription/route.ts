import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionStatus, type SubscriptionStatusType } from "@/lib/types";
import { SHOPIFY_API_VERSION } from "@/lib/shopify/client";

// Use Node.js runtime for API calls
export const runtime = "nodejs";

/**
 * Verify user's subscription status with Shopify
 * Called when user signs up or needs to verify their subscription
 */
export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    const { email, shopifyCustomerId } = await req.json();

    if (!email && !shopifyCustomerId) {
      return NextResponse.json(
        { error: "Email or Shopify customer ID required" },
        { status: 400 }
      );
    }

    // Get Shopify credentials from environment
    const shopifyStore = process.env.SHOPIFY_STORE_DOMAIN; // e.g., "hoopsking"
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopifyStore || !shopifyAccessToken) {
      console.error("Shopify credentials not configured");
      return NextResponse.json(
        { error: "Shopify integration not configured" },
        { status: 500 }
      );
    }

    // Find customer in Shopify by email or customer ID
    let customer: any = null;

    if (shopifyCustomerId) {
      // Fetch customer by ID
      const customerResponse = await fetch(
        `https://${shopifyStore}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/${shopifyCustomerId}.json`,
        {
          headers: {
            "X-Shopify-Access-Token": shopifyAccessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (customerResponse.ok) {
        const data = await customerResponse.json();
        customer = data.customer;
      }
    } else if (email) {
      // Search for customer by email
      const searchResponse = await fetch(
        `https://${shopifyStore}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
          email
        )}`,
        {
          headers: {
            "X-Shopify-Access-Token": shopifyAccessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (searchResponse.ok) {
        const data = await searchResponse.json();
        if (data.customers && data.customers.length > 0) {
          customer = data.customers[0];
        }
      }
    }

    if (!customer) {
      return NextResponse.json({
        verified: false,
        status: SubscriptionStatus.UNSET,
        message: "Customer not found in Shopify",
      });
    }

    // Check for active orders/subscriptions
    // 🔌 TODO: Review this after shopify auth flow is tested
    const ordersResponse = await fetch(
      `https://${shopifyStore}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/${customer.id}/orders.json?status=any&limit=10`,
      {
        headers: {
          "X-Shopify-Access-Token": shopifyAccessToken,
          "Content-Type": "application/json",
        },
      }
    );

    let subscriptionStatus: SubscriptionStatusType = SubscriptionStatus.UNSET;
    let subscriptionStartDate: Date | undefined;
    let subscriptionEndDate: Date | undefined;

    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      const orders = ordersData.orders || [];

      // Find the most recent paid order with a subscription product
      // 🔌 TODO: Adjust condition per published Shopifysubscription properties
      const subscriptionOrder = orders
        .filter((order: any) => order.financial_status === "paid")
        .find((order: any) => {
          return order.line_items.some((item: any) => {
            return (
              item.product_type === "subscription" ||
              item.sku?.includes("subscription") ||
              item.variant_title?.toLowerCase().includes("subscription") ||
              item.properties?.some((p: any) => p.name === "subscription")
            );
          });
        });

      if (subscriptionOrder) {
        subscriptionStatus = SubscriptionStatus.ACTIVE;
        subscriptionStartDate = new Date(subscriptionOrder.created_at);

        // Calculate end date (1 year subscription)
        subscriptionEndDate = new Date(subscriptionStartDate);
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1); // 1 year subscription

        // Check if subscription has expired
        if (subscriptionEndDate < new Date()) {
          subscriptionStatus = SubscriptionStatus.EXPIRED;
        }

        // Check if order was cancelled
        if (subscriptionOrder.cancelled_at) {
          subscriptionStatus = SubscriptionStatus.CANCELLED;
          subscriptionEndDate = new Date(subscriptionOrder.cancelled_at);
        }
      }
    }

    // Update user profile in Supabase
    // First, find the user by email or shopify_customer_id
    let profileQuery = supabase.from("profiles").select("id");

    if (shopifyCustomerId) {
      profileQuery = profileQuery.eq("shopify_customer_id", shopifyCustomerId);
    } else {
      profileQuery = profileQuery.eq("email", email);
    }

    const { data: profile, error: findError } = await profileQuery.single();

    if (profile) {
      // Update existing profile
      const updateData: any = {
        shopify_customer_id: String(customer.id),
        subscription_status: subscriptionStatus,
        email: customer.email || email,
        updated_at: new Date().toISOString(),
      };

      if (subscriptionStartDate) {
        updateData.subscription_start_date =
          subscriptionStartDate.toISOString();
      }
      if (subscriptionEndDate) {
        updateData.subscription_end_date = subscriptionEndDate.toISOString();
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }
    }

    return NextResponse.json({
      verified: true,
      status: subscriptionStatus,
      shopifyCustomerId: String(customer.id),
      email: customer.email,
      subscriptionStartDate: subscriptionStartDate?.toISOString(),
      subscriptionEndDate: subscriptionEndDate?.toISOString(),
    });
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to verify subscription",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
