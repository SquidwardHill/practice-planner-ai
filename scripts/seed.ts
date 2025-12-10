// Simple seeder - creates test users with different subscription statuses

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials!");
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
    email: "trial@test.com",
    password: "test123",
    full_name: "Trial User",
    subscription_status: "trial" as const,
    trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    email: "active@test.com",
    password: "test123",
    full_name: "Active User",
    subscription_status: "active" as const,
    subscription_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    shopify_customer_id: "shopify_123",
  },
];

async function seed() {
  console.log("🌱 Seeding database...\n");

  for (const user of testUsers) {
    try {
      // Check if exists
      const { data: users } = await supabase.auth.admin.listUsers();
      const exists = users?.users.find((u) => u.email === user.email);

      if (exists) {
        console.log(`⚠️  ${user.email} already exists`);
        continue;
      }

      // Create user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

      if (authError) throw authError;

      // Update profile (trigger creates it, but we update subscription info)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          subscription_status: user.subscription_status,
          trial_end_date: user.trial_end_date?.toISOString() || null,
          subscription_start_date:
            user.subscription_start_date?.toISOString() || null,
          subscription_end_date:
            user.subscription_end_date?.toISOString() || null,
          shopify_customer_id: user.shopify_customer_id || null,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error(`   Profile update error:`, profileError.message);
      }

      console.log(`✅ Created ${user.email} (${user.subscription_status})`);
    } catch (error: any) {
      console.error(`❌ Error creating ${user.email}:`, error.message);
    }
  }

  console.log("\n✨ Done!");
}

seed().catch(console.error);
