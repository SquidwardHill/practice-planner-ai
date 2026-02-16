import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/schedule/move-to-plan
 * Move all of the user's schedule entries from one plan to another.
 * Body: { from_plan_id: string, to_plan_id: string }
 * Both plans must belong to the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { from_plan_id, to_plan_id } = body as {
      from_plan_id?: string;
      to_plan_id?: string;
    };

    if (!from_plan_id || !to_plan_id) {
      return NextResponse.json(
        { error: "from_plan_id and to_plan_id are required" },
        { status: 400 }
      );
    }

    if (from_plan_id === to_plan_id) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    const [{ data: fromPlan }, { data: toPlan }] = await Promise.all([
      supabase
        .from("practice_plans")
        .select("id")
        .eq("id", from_plan_id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("practice_plans")
        .select("id")
        .eq("id", to_plan_id)
        .eq("user_id", user.id)
        .single(),
    ]);

    if (!fromPlan || !toPlan) {
      return NextResponse.json(
        { error: "One or both plans not found or access denied" },
        { status: 404 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("scheduled_practices")
      .update({ practice_plan_id: to_plan_id })
      .eq("user_id", user.id)
      .eq("practice_plan_id", from_plan_id)
      .select("id");

    if (updateError) {
      console.error("Error moving schedule:", updateError);
      return NextResponse.json(
        { error: "Failed to update schedule", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: updated?.length ?? 0,
    });
  } catch (error) {
    console.error("Error in POST /api/schedule/move-to-plan:", error);
    return NextResponse.json(
      {
        error: "Error updating schedule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
