// Cleanup script to remove test users
// Useful for cleaning up after tests

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testEmails = [
  "trial@test.com",
  "active@test.com",
  "cancelled@test.com",
  "expired@test.com",
  "expired_trial@test.com",
];

async function cleanup() {
  console.log("🧹 Starting cleanup...\n");

  for (const email of testEmails) {
    try {
      // List all users and find by email
      const { data: users, error: listError } =
        await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`❌ Error listing users:`, listError.message);
        continue;
      }

      const user = users?.users.find((u) => u.email === email);

      if (user) {
        // Delete user (this will cascade delete profile and all related data)
        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) {
          console.error(`❌ Error deleting user ${email}:`, error.message);
        } else {
          console.log(`✅ Deleted user: ${email}`);
        }
      } else {
        console.log(`⚠️  User ${email} not found, skipping...`);
      }
    } catch (error: any) {
      console.error(`❌ Unexpected error for ${email}:`, error.message);
    }
  }

  console.log("\n✨ Cleanup complete!");
}

// Run if called directly
if (require.main === module) {
  cleanup()
    .then(() => {
      console.log("\n✅ Cleanup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Cleanup failed:", error);
      process.exit(1);
    });
}

export { cleanup };
