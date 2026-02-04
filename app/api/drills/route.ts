import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type CreateDrillInput } from "@/lib/types/drill";

/**
 * POST /api/drills
 * Create a new drill for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { category_id, name, minutes, notes, media_links } =
      body as CreateDrillInput;

    // Validate required fields
    if (!category_id || !name) {
      return NextResponse.json(
        { error: "Category and name are required" },
        { status: 400 }
      );
    }

    // Check for duplicate name (per user)
    const { data: existing } = await supabase
      .from("drills")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A drill with this name already exists" },
        { status: 409 }
      );
    }

    // Verify category belongs to user
    const { data: categoryRow } = await supabase
      .from("categories")
      .select("id")
      .eq("id", category_id)
      .eq("user_id", user.id)
      .single();

    if (!categoryRow) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    // Insert new drill
    const { data: drill, error: insertError } = await supabase
      .from("drills")
      .insert({
        user_id: user.id,
        category_id,
        name: name.trim(),
        minutes: minutes || 0,
        notes: notes?.trim() || null,
        media_links: media_links?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating drill:", insertError);
      return NextResponse.json(
        { error: "Failed to create drill", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: drill }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating drill:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
