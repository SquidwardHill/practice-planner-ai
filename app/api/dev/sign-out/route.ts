import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonProduction } from "@/lib/utils/dev-helpers";

/**
 * Dev-only API route to sign out
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

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to sign out" },
      { status: 500 }
    );
  }
}

