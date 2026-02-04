import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PracticeBlock {
  time_slot: string;
  drill_name: string;
  category: string;
  duration: number;
  notes: string;
}

interface UpdatePlanBody {
  practice_title: string;
  total_duration_minutes: number;
  blocks: PracticeBlock[];
}

/**
 * PATCH /api/plans/[id]
 * Update an existing practice plan (must belong to authenticated user)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdatePlanBody;
    const { practice_title, total_duration_minutes, blocks } = body;

    if (!practice_title || typeof total_duration_minutes !== "number") {
      return NextResponse.json(
        { error: "practice_title and total_duration_minutes are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: "blocks must be an array" },
        { status: 400 }
      );
    }

    const { data: plan, error: updateError } = await supabase
      .from("practice_plans")
      .update({
        practice_title: practice_title.trim(),
        total_duration_minutes,
        blocks,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, practice_title, total_duration_minutes, created_at")
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      console.error("Error updating plan:", updateError);
      return NextResponse.json(
        { error: "Failed to update plan", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Unexpected error updating plan:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plans/[id]
 * Delete a practice plan by ID (must belong to authenticated user)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: deleted, error: deleteError } = await supabase
      .from("practice_plans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id");

    if (deleteError) {
      console.error("Error deleting plan:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete plan", details: deleteError.message },
        { status: 500 }
      );
    }

    if (!deleted?.length) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error deleting plan:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
