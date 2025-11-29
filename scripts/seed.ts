// Database seeder script
// Creates test users with different subscription statuses for testing

import { createClient } from "@supabase/supabase-js";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing required environment variables:");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY:", !!supabaseServiceRoleKey);
  process.exit(1);
}

// Use service role key to bypass RLS for seeding
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  subscription_status: SubscriptionStatus;
  shopify_customer_id?: string;
  trial_end_date?: Date;
  subscription_start_date?: Date;
  subscription_end_date?: Date;
}

const testUsers: TestUser[] = [
  {
    email: "trial@test.com",
    password: "testpassword123",
    full_name: "Trial User",
    subscription_status: "trial",
    trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    email: "active@test.com",
    password: "testpassword123",
    full_name: "Active Subscriber",
    subscription_status: "active",
    shopify_customer_id: "shopify_customer_123",
    subscription_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  {
    email: "cancelled@test.com",
    password: "testpassword123",
    full_name: "Cancelled Subscriber",
    subscription_status: "cancelled",
    shopify_customer_id: "shopify_customer_456",
    subscription_start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    subscription_end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now (still has access)
  },
  {
    email: "expired@test.com",
    password: "testpassword123",
    full_name: "Expired User",
    subscription_status: "expired",
    shopify_customer_id: "shopify_customer_789",
    subscription_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    subscription_end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
  },
  {
    email: "expired_trial@test.com",
    password: "testpassword123",
    full_name: "Expired Trial User",
    subscription_status: "trial",
    trial_end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (expired)
  },
];

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const createdUsers: Array<{ id: string; email: string }> = [];

  for (const userData of testUsers) {
    try {
      // Check if user already exists by listing users
      const { data: usersList } = await supabase.auth.admin.listUsers();
      const existingUser = usersList?.users.find((u) => u.email === userData.email);

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        createdUsers.push({
          id: existingUser.id,
          email: userData.email,
        });
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email for testing
        user_metadata: {
          full_name: userData.full_name,
        },
      });

      if (authError) {
        console.error(`❌ Error creating user ${userData.email}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.error(`❌ No user data returned for ${userData.email}`);
        continue;
      }

      const userId = authData.user.id;

      // Create profile with subscription data
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email: userData.email,
        full_name: userData.full_name,
        subscription_status: userData.subscription_status,
        shopify_customer_id: userData.shopify_customer_id || null,
        trial_end_date: userData.trial_end_date?.toISOString() || null,
        subscription_start_date: userData.subscription_start_date?.toISOString() || null,
        subscription_end_date: userData.subscription_end_date?.toISOString() || null,
      });

      if (profileError) {
        console.error(
          `❌ Error creating profile for ${userData.email}:`,
          profileError.message
        );
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(userId);
        continue;
      }

      console.log(`✅ Created user: ${userData.email} (${userData.subscription_status})`);
      createdUsers.push({ id: userId, email: userData.email });

      // Create some test data for active and trial users
      if (
        userData.subscription_status === "active" ||
        userData.subscription_status === "trial"
      ) {
        // Create a test team
        const { data: team } = await supabase
          .from("teams")
          .insert({
            user_id: userId,
            name: `${userData.full_name}'s Team`,
            primary_color: "#FF5733",
            secondary_color: "#33FF57",
          })
          .select()
          .single();

        if (team) {
          console.log(`   └─ Created team: ${team.name}`);
        }

        // Create some test drills
        const testDrills = [
          {
            user_id: userId,
            name: "3-Man Weave",
            category: "Warmup",
            duration: 10,
            description: "Full court passing drill",
            steps: ["Start at baseline", "Pass and follow", "Finish with layup"],
            coaching_points: ["Keep passes crisp", "Stay in lanes"],
          },
          {
            user_id: userId,
            name: "Shell Drill",
            category: "Defense",
            duration: 15,
            description: "4v4 half court defense",
            steps: ["Set up in shell", "Ball moves", "Defense rotates"],
            coaching_points: ["Help side positioning", "Communication"],
          },
        ];

        const { data: drills } = await supabase
          .from("drills")
          .insert(testDrills)
          .select();

        if (drills && drills.length > 0) {
          console.log(`   └─ Created ${drills.length} test drills`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Unexpected error for ${userData.email}:`, error.message);
    }
  }

  console.log(`\n✨ Seed complete! Created/verified ${createdUsers.length} users.`);
  console.log("\nTest users:");
  testUsers.forEach((user) => {
    console.log(`  - ${user.email} (${user.password}) - ${user.subscription_status}`);
  });

  return createdUsers;
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log("\n✅ Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Seeding failed:", error);
      process.exit(1);
    });
}

export { seed, testUsers };

