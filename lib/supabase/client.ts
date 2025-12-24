import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Support both old and new env variable names for backwards compatibility
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase environment variables. ` +
        `URL: ${supabaseUrl ? "set" : "missing"}, ` +
        `Key: ${supabaseKey ? "set" : "missing"}. ` +
        `Please check your environment variables.`
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
