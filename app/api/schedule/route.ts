import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
 * List scheduled practices for the authenticated user in the date range.
 * Returns schedule entries with nested plan (practice_title, total_duration_minutes).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const planIdParam = searchParams.get("plan_id");
    const futureOnly = searchParams.get("future_only") === "1";

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    let from: string;
    let to: string;
    if (planIdParam && futureOnly) {
      from = today;
      to = new Date(now.getFullYear() + 1, 11, 31).toISOString().slice(0, 10);
    } else {
      from =
        fromParam ??
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      to =
        toParam ??
        new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .slice(0, 10);
    }

    let query = supabase
      .from("scheduled_practices")
      .select(
        `
        id,
        practice_plan_id,
        scheduled_date,
        created_at,
        practice_plans (
          id,
          practice_title,
          total_duration_minutes
        )
      `
      )
      .eq("user_id", user.id)
      .gte("scheduled_date", from)
      .lte("scheduled_date", to)
      .order("scheduled_date", { ascending: true });

    if (planIdParam) {
      query = query.eq("practice_plan_id", planIdParam);
    }

    const { data: schedule, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching schedule:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch schedule", details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(schedule ?? []);
  } catch (error) {
    console.error("Error in GET /api/schedule:", error);
    return NextResponse.json(
      {
        error: "Error fetching schedule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedule
 * Attach a practice plan to a date. Body: { practice_plan_id: string, scheduled_date: "YYYY-MM-DD" }
 * If the user already has a practice on that date, it is replaced (upsert).
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
    const { practice_plan_id, scheduled_date } = body as {
      practice_plan_id?: string;
      scheduled_date?: string;
    };

    if (!practice_plan_id || !scheduled_date) {
      return NextResponse.json(
        { error: "practice_plan_id and scheduled_date are required" },
        { status: 400 }
      );
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduled_date)) {
      return NextResponse.json(
        { error: "scheduled_date must be YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Verify plan belongs to user
    const { data: plan, error: planError } = await supabase
      .from("practice_plans")
      .select("id")
      .eq("id", practice_plan_id)
      .eq("user_id", user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Practice plan not found or access denied" },
        { status: 404 }
      );
    }

    // Upsert: insert or replace for this user+date
    const { data: scheduled, error: upsertError } = await supabase
      .from("scheduled_practices")
      .upsert(
        {
          user_id: user.id,
          practice_plan_id,
          scheduled_date,
        },
        {
          onConflict: "user_id,scheduled_date",
        }
      )
      .select("id, practice_plan_id, scheduled_date, created_at")
      .single();

    if (upsertError) {
      console.error("Error upserting schedule:", upsertError);
      return NextResponse.json(
        { error: "Failed to schedule practice", details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(scheduled);
  } catch (error) {
    console.error("Error in POST /api/schedule:", error);
    return NextResponse.json(
      {
        error: "Error scheduling practice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
