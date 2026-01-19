import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type UpdateDrillInput } from "@/lib/types/drill";

/**
 * GET /api/drills/[id]
 * Get a single drill by ID (must belong to authenticated user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch drill
    const { data: drill, error: fetchError } = await supabase
      .from("drills")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Drill not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching drill:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch drill", details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: drill });
  } catch (error) {
    console.error("Unexpected error fetching drill:", error);
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
 * PATCH /api/drills/[id]
 * Update a drill by ID (must belong to authenticated user)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify drill exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("drills")
      .select("id, name")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Drill not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { category, name, minutes, notes, media_links } = body as UpdateDrillInput;

    // Build update object (only include provided fields)
    const updates: Partial<UpdateDrillInput> = {};
    if (category !== undefined) updates.category = category.trim();
    if (name !== undefined) updates.name = name.trim();
    if (minutes !== undefined) updates.minutes = minutes;
    if (notes !== undefined) updates.notes = notes?.trim() || null;
    if (media_links !== undefined) updates.media_links = media_links?.trim() || null;

    // If name is being updated, check for duplicates
    if (updates.name && updates.name !== existing.name) {
      const { data: duplicate } = await supabase
        .from("drills")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", updates.name)
        .neq("id", id)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { error: "A drill with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update drill
    const { data: drill, error: updateError } = await supabase
      .from("drills")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating drill:", updateError);
      return NextResponse.json(
        { error: "Failed to update drill", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: drill });
  } catch (error) {
    console.error("Unexpected error updating drill:", error);
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
 * DELETE /api/drills/[id]
 * Delete a drill by ID (must belong to authenticated user)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify drill exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("drills")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Drill not found" },
        { status: 404 }
      );
    }

    // Delete drill
    const { error: deleteError } = await supabase
      .from("drills")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting drill:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete drill", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Drill deleted successfully" });
  } catch (error) {
    console.error("Unexpected error deleting drill:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
