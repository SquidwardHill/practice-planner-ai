import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function deleteDrills() {
  console.log("Delete Drills Script\n");

  // Get user email
  const email = await question("Enter user email (or 'all' to delete for all users): ");

  if (!email || email.trim() === "") {
    console.error("Email is required");
    rl.close();
    process.exit(1);
  }

  if (email.toLowerCase() === "all") {
    // Delete for all users
    const confirm = await question(
      "⚠️  WARNING: This will delete ALL drills for ALL users. Type 'DELETE ALL' to confirm: "
    );

    if (confirm !== "DELETE ALL") {
      console.log("Cancelled.");
      rl.close();
      process.exit(0);
    }

    // Get count first
    const { count } = await supabase
      .from("drills")
      .select("*", { count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Delete all drills
    const { error } = await supabase
      .from("drills")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error("Error deleting drills:", error);
      rl.close();
      process.exit(1);
    }

    console.log(`\n✅ Deleted ${count || 0} drills for all users.`);
  } else {
    // Delete for specific user
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find((u) => u.email === email);

    if (!user) {
      console.error(`User with email ${email} not found`);
      rl.close();
      process.exit(1);
    }

    const confirm = await question(
      `⚠️  This will delete ALL drills for ${email}. Type 'DELETE' to confirm: `
    );

    if (confirm !== "DELETE") {
      console.log("Cancelled.");
      rl.close();
      process.exit(0);
    }

    // Get count first
    const { count } = await supabase
      .from("drills")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    // Delete drills
    const { error } = await supabase
      .from("drills")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting drills:", error);
      rl.close();
      process.exit(1);
    }

    console.log(`\n✅ Deleted ${count || 0} drills for ${email}.`);
  }

  rl.close();
}

deleteDrills().catch((error) => {
  console.error("Error:", error);
  rl.close();
  process.exit(1);
});

