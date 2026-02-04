import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PracticeBlock {
  time_slot: string;
  drill_name: string;
  category: string;
  duration: number;
  notes: string;
}

interface SavePlanBody {
  practice_title: string;
  total_duration_minutes: number;
  blocks: PracticeBlock[];
}

/**
 * GET /api/plans
 * List the authenticated user's saved practice plans
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: plans, error: fetchError } = await supabase
      .from("practice_plans")
      .select("id, practice_title, total_duration_minutes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching plans:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to fetch plans",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(plans ?? []);
  } catch (error) {
    console.error("Error in GET /api/plans:", error);
    return NextResponse.json(
      {
        error: "Error fetching plans",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plans
 * Save a finalized practice plan for the authenticated user
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

    const body = (await request.json()) as SavePlanBody;
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

    const { data: plan, error: insertError } = await supabase
      .from("practice_plans")
      .insert({
        user_id: user.id,
        practice_title: practice_title.trim(),
        total_duration_minutes,
        blocks,
      })
      .select("id, practice_title, total_duration_minutes, created_at")
      .single();

    if (insertError) {
      console.error("Error saving practice plan:", insertError);
      const message =
        insertError.message ||
        (insertError as { message?: string }).message ||
        "Unknown database error";
      return NextResponse.json(
        {
          error: "Failed to save plan",
          details: message,
          code: (insertError as { code?: string }).code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error in POST /api/plans:", error);
    return NextResponse.json(
      {
        error: "Error saving practice plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
