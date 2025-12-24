import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  findCustomerByEmail,
  getCustomerOrders,
  getSubscriptionFromOrders,
} from "@/lib/shopify/client";

// Use Node.js runtime for API calls
export const runtime = "nodejs";

/**
 * Link a Shopify customer account to the authenticated user's app account
 */
export async function POST(req: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No auth token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token and get user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Get email from request body (optional - can use user's email)
    const { email: providedEmail } = await req.json();
    const emailToSearch = providedEmail || user.email;

    if (!emailToSearch) {
      return NextResponse.json(
        {
          error:
            "Email required - provide email in request body or ensure user has email",
        },
        { status: 400 }
      );
    }

    // Search for customer in Shopify by email
    let customer;
    try {
      customer = await findCustomerByEmail(emailToSearch);
    } catch (error) {
      console.error("Error searching Shopify customer:", error);
      return NextResponse.json(
        { error: "Failed to search Shopify customers" },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          linked: false,
          error: "Customer not found",
          message: `No Shopify customer found with email: ${emailToSearch}. Make sure you used the same email when purchasing your subscription.`,
        },
        { status: 404 }
      );
    }

    const shopifyCustomerId = String(customer.id);

    // Check if this Shopify customer is already linked to another account
    const supabase = await createServerClient();
    const { data: existingLink } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("shopify_customer_id", shopifyCustomerId)
      .single();

    if (existingLink && existingLink.id !== user.id) {
      return NextResponse.json(
        {
          linked: false,
          error: "Already linked",
          message: `This Shopify account is already linked to another user (${existingLink.email}). Contact support if this is incorrect.`,
        },
        { status: 409 }
      );
    }

    // Get customer's orders to verify subscription
    let orders: any[] = [];
    try {
      orders = await getCustomerOrders(customer.id, 10);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      // Continue with trial status if orders can't be fetched
      orders = [];
    }

    // Extract subscription information from orders
    const subscriptionInfo = getSubscriptionFromOrders(orders);
    const subscriptionStatus = subscriptionInfo.status;
    const subscriptionStartDate = subscriptionInfo.startDate;
    const subscriptionEndDate = subscriptionInfo.endDate;

    // Update user's profile with Shopify customer ID and subscription info
    const updateData: any = {
      shopify_customer_id: shopifyCustomerId,
      subscription_status: subscriptionStatus,
      email: customer.email || emailToSearch,
      updated_at: new Date().toISOString(),
    };

    if (subscriptionStartDate) {
      updateData.subscription_start_date = subscriptionStartDate.toISOString();
    }
    if (subscriptionEndDate) {
      updateData.subscription_end_date = subscriptionEndDate.toISOString();
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        {
          error: "Failed to link account",
          message: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      linked: true,
      shopifyCustomerId,
      email: customer.email,
      subscriptionStatus,
      subscriptionStartDate: subscriptionStartDate?.toISOString(),
      subscriptionEndDate: subscriptionEndDate?.toISOString(),
      message: "Account successfully linked to Shopify customer",
    });
  } catch (error) {
    console.error("Error linking Shopify account:", error);
    return NextResponse.json(
      {
        error: "Failed to link account",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Get the current user's Shopify account link status
 * Useful for checking if account is already linked
 */
export async function GET(req: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No auth token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token and get user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Get user's profile
    const supabase = await createServerClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "shopify_customer_id, subscription_status, subscription_start_date, subscription_end_date, email"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      linked: !!profile.shopify_customer_id,
      shopifyCustomerId: profile.shopify_customer_id,
      subscriptionStatus: profile.subscription_status,
      subscriptionStartDate: profile.subscription_start_date,
      subscriptionEndDate: profile.subscription_end_date,
      email: profile.email,
    });
  } catch (error) {
    console.error("Error checking link status:", error);
    return NextResponse.json(
      {
        error: "Failed to check link status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
