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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: drill, error: fetchError } = await supabase
      .from("drills")
      .select("*, categories(id, name)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Drill not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Drill not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { category_id, name, minutes, notes, media_links } =
      body as UpdateDrillInput;

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (category_id !== undefined) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("id", category_id)
        .eq("user_id", user.id)
        .single();
      if (!cat) {
        return NextResponse.json(
          { error: "Category not found or access denied" },
          { status: 404 }
        );
      }
      updates.category_id = category_id;
    }
    if (name !== undefined) updates.name = name.trim();
    if (minutes !== undefined) updates.minutes = minutes;
    if (notes !== undefined) updates.notes = notes?.trim() || null;
    if (media_links !== undefined)
      updates.media_links = media_links?.trim() || null;

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify drill exists and belongs to user, get media_links for cleanup
    const { data: existing, error: fetchError } = await supabase
      .from("drills")
      .select("id, media_links")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Drill not found" }, { status: 404 });
    }

    // Delete associated media files from storage if they exist
    if (existing.media_links) {
      const BUCKET_NAME = "Drill Media";
      const mediaUrls = existing.media_links
        .split(",")
        .map((link: string) => link.trim());

      for (const url of mediaUrls) {
        try {
          // Extract file path from URL
          // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
          const urlParts = url.split("/");
          const bucketIndex = urlParts.findIndex(
            (part: string) => part === "public"
          );

          if (bucketIndex > 0 && bucketIndex < urlParts.length - 1) {
            const bucketName = urlParts[bucketIndex + 1];
            const filePath = urlParts.slice(bucketIndex + 2).join("/");

            // Only delete if file is in user's folder and bucket matches
            if (
              bucketName === BUCKET_NAME &&
              filePath.startsWith(`${user.id}/`)
            ) {
              const { error: storageError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([filePath]);

              if (storageError) {
                // If bucket not found, log but don't fail the drill deletion
                if (
                  storageError.message?.includes("bucket") ||
                  storageError.message?.includes("not found")
                ) {
                  console.warn(
                    `Bucket "${BUCKET_NAME}" not found or inaccessible. Skipping file deletion for ${filePath}`
                  );
                } else {
                  console.error(
                    `Error deleting media file ${filePath}:`,
                    storageError
                  );
                }
                // Continue with drill deletion even if file deletion fails
              }
            }
          }
        } catch (error) {
          console.error(`Error processing media URL ${url}:`, error);
          // Continue with drill deletion even if file deletion fails
        }
      }
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

    return NextResponse.json({
      success: true,
      message: "Drill deleted successfully",
    });
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
