import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonProduction } from "@/lib/utils/dev-helpers";

/**
 * Dev-only API route to clear all drills for the current user
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
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get count before deletion
    const { count } = await supabase
      .from("drills")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Delete all drills for the current user
    const { error: deleteError } = await supabase
      .from("drills")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Failed to clear drills" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${count || 0} drill${count !== 1 ? "s" : ""}`,
      deleted: count || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clear drills" },
      { status: 500 }
    );
  }
}
