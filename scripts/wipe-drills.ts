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

async function wipeAllDrills() {
  console.log("⚠️  WIPE ALL DRILLS SCRIPT\n");
  console.log("This will delete ALL drills for ALL users.\n");

  // Get count first
  const { count, error: countError } = await supabase
    .from("drills")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error getting drill count:", countError);
    process.exit(1);
  }

  console.log(`Found ${count || 0} drills to delete.\n`);

  // Delete all drills
  const { error } = await supabase.from("drills").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error("Error deleting drills:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${count || 0} drills.\n`);
  console.log("You can now re-import your drills with proper UTF-8 encoding.");
}

wipeAllDrills().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
