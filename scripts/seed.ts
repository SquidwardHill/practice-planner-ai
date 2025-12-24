import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  console.error("\nSet in .env.local:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=your_url");
  console.error("  SUPABASE_KEY=your_service_role_key");
  process.exit(1);
}

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
    subscription_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    subscription_end_date: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000), // 335 days from now
  },
  {
    email: "trial@test.com",
    password: "test123",
    full_name: "Trial Subscription User",
    subscription_status: "trial",
    shopify_customer_id: "shopify_trial_456",
    subscription_start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
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
    subscription_start_date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
    subscription_end_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago (expired)
  },
  {
    email: "cancelled@test.com",
    password: "test123",
    full_name: "Cancelled Subscription User",
    subscription_status: "cancelled",
    shopify_customer_id: "shopify_cancelled_101",
    subscription_start_date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
    subscription_end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (cancelled)
  },
];

async function seed() {
  console.log("Seeding database with test users...\n");

  for (const user of testUsers) {
    try {
      // Check if exists
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find((u) => u.email === user.email);

      let userId: string;

      if (existingUser) {
        console.log(`${user.email} already exists, updating profile...`);
        userId = existingUser.id;
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
        console.log(`Created ${user.email}`);
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
        console.error(`Error updating profile for ${user.email}:`, profileError);
      } else {
        console.log(
          `  ✓ Profile updated with subscription_status: ${user.subscription_status}`
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error processing ${user.email}:`, message);
    }
  }

  console.log("\n✅ Seeding complete!");
  console.log("\nTest users:");
  console.log("  • active@test.com / test123 - Active subscription");
  console.log("  • trial@test.com / test123 - Trial subscription");
  console.log("  • unset@test.com / test123 - No subscription (unset)");
  console.log("  • expired@test.com / test123 - Expired subscription");
  console.log("  • cancelled@test.com / test123 - Cancelled subscription");
  console.log("\n💡 Note: Sessions are configured to last 10 years for test users.");
  console.log("   If you just updated supabase/config.toml, restart Supabase:");
  console.log("   npm run supabase:stop && npm run supabase:start");
}

seed().catch(console.error);
