import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isNonProduction } from "@/lib/utils/dev-helpers";

/**
 * Dev-only API route to seed the database with test users
 * Works in development and staging/preview environments
 */
export async function POST() {
  // Only allow in non-production environments
  if (!isNonProduction()) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        error: "Missing Supabase credentials",
        message:
          "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
      },
      { status: 500 }
    );
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testUsers = [
    {
      email: "active@test.com",
      password: "test123",
      full_name: "Active Subscription User",
      subscription_status: "active",
      shopify_customer_id: "shopify_active_123",
      subscription_start_date: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ), // 30 days ago
      subscription_end_date: new Date(
        Date.now() + 335 * 24 * 60 * 60 * 1000
      ), // 335 days from now
    },
    {
      email: "trial@test.com",
      password: "test123",
      full_name: "Trial Subscription User",
      subscription_status: "trial",
      shopify_customer_id: "shopify_trial_456",
      subscription_start_date: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000
      ), // 5 days ago
      trial_end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
    },
    {
      email: "unset@test.com",
      password: "test123",
      full_name: "No Subscription User",
      subscription_status: "unset",
      shopify_customer_id: null,
      subscription_start_date: null,
      subscription_end_date: null,
    },
    {
      email: "expired@test.com",
      password: "test123",
      full_name: "Expired Subscription User",
      subscription_status: "expired",
      shopify_customer_id: "shopify_expired_789",
      subscription_start_date: new Date(
        Date.now() - 400 * 24 * 60 * 60 * 1000
      ), // 400 days ago
      subscription_end_date: new Date(
        Date.now() - 35 * 24 * 60 * 60 * 1000
      ), // 35 days ago (expired)
    },
    {
      email: "cancelled@test.com",
      password: "test123",
      full_name: "Cancelled Subscription User",
      subscription_status: "cancelled",
      shopify_customer_id: "shopify_cancelled_101",
      subscription_start_date: new Date(
        Date.now() - 200 * 24 * 60 * 60 * 1000
      ), // 200 days ago
      subscription_end_date: new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000
      ), // 10 days ago (cancelled)
    },
  ];

  const results: Array<{ email: string; status: string; error?: string }> =
    [];

  try {
    for (const user of testUsers) {
      try {
        // Check if user exists
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users.find((u) => u.email === user.email);

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          results.push({
            email: user.email,
            status: "updated",
          });
        } else {
          // Create user (trigger will create profile automatically)
          const { data: newUser, error: authError } =
            await supabase.auth.admin.createUser({
              email: user.email,
              password: user.password,
              email_confirm: true,
              user_metadata: { full_name: user.full_name },
            });

          if (authError) throw authError;
          if (!newUser.user) throw new Error("User creation failed");

          userId = newUser.user.id;
          results.push({
            email: user.email,
            status: "created",
          });
        }

        // Update profile with subscription information
        const profileUpdate: any = {
          subscription_status: user.subscription_status,
          shopify_customer_id: user.shopify_customer_id,
        };

        if (user.subscription_start_date) {
          profileUpdate.subscription_start_date =
            user.subscription_start_date.toISOString();
        }
        if (user.subscription_end_date) {
          profileUpdate.subscription_end_date =
            user.subscription_end_date.toISOString();
        }
        if (user.trial_end_date) {
          profileUpdate.trial_end_date = user.trial_end_date.toISOString();
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", userId);

        if (profileError) {
          results.push({
            email: user.email,
            status: "error",
            error: `Profile update failed: ${profileError.message}`,
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({
          email: user.email,
          status: "error",
          error: message,
        });
      }
    }

    const successCount = results.filter((r) => r.status !== "error").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      message: `Seeded ${successCount} users${errorCount > 0 ? ` (${errorCount} errors)` : ""}`,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        results,
      },
      { status: 500 }
    );
  }
}

