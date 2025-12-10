// Simple seeder - creates test users

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
    email: "trial@test.com",
    password: "test123",
    full_name: "Trial User",
  },
  {
    email: "active@test.com",
    password: "test123",
    full_name: "Active User",
  },
];

async function seed() {
  console.log("Seeding database...\n");

  for (const user of testUsers) {
    try {
      // Check if exists
      const { data: users } = await supabase.auth.admin.listUsers();
      const exists = users?.users.find((u) => u.email === user.email);

      if (exists) {
        console.log(`${user.email} already exists`);
        continue;
      }

      // Create user (trigger will create profile automatically if migration is run)
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

      if (authError) throw authError;

      console.log(`Created ${user.email}`);
    } catch (error: any) {
      console.error(`Error creating ${user.email}:`, error.message);
    }
  }

  console.log("\nDone");
}

seed().catch(console.error);
