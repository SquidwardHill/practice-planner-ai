import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/drills/delete-all
 * Delete all drills for the authenticated user
 */
export async function DELETE() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // First get the count of drills to be deleted
    const { count } = await supabase
      .from("drills")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    // Delete all drills for this user
    const { error: deleteError } = await supabase
      .from("drills")
      .delete()
      .eq("user_id", user.id)
      .select();

    if (deleteError) {
      console.error("Error deleting drills:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete drills", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted all drills for user ${user.email}`,
      deletedCount: count || 0,
    });
  } catch (error) {
    console.error("Unexpected error deleting drills:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

