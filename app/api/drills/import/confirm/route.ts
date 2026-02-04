import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type DrillImportRow } from "@/lib/types/drill";

/**
 * POST /api/drills/import/confirm
 * Confirm and save the imported drills to the database
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

    // Get rows from request body
    const body = await request.json();
    const { rows } = body as { rows: DrillImportRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    // Collect distinct category names and ensure they exist (get or create)
    const categoryNames = [
      ...new Set(
        rows.map(
          (row) => (row.Category && row.Category.trim()) || "Uncategorized"
        )
      ),
    ];
    const categoryIdByName: Record<string, string> = {};

    for (const name of categoryNames) {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", name)
        .single();

      if (existing) {
        categoryIdByName[name] = existing.id;
      } else {
        const { data: created, error: createErr } = await supabase
          .from("categories")
          .insert({ user_id: user.id, name })
          .select("id")
          .single();
        if (createErr || !created) continue;
        categoryIdByName[name] = created.id;
      }
    }

    // Default category for missing/invalid names
    const defaultCategoryId =
      categoryIdByName["Uncategorized"] ?? Object.values(categoryIdByName)[0];

    // Transform import rows to database format (with category_id)
    const drillsToInsert = rows.map((row) => {
      let minutes = 5;
      if (row.Minutes !== undefined && row.Minutes !== null) {
        if (typeof row.Minutes === "string") {
          const parsed = parseInt(row.Minutes, 10);
          minutes = isNaN(parsed) ? 5 : parsed;
        } else if (typeof row.Minutes === "number" && !isNaN(row.Minutes)) {
          minutes = row.Minutes;
        }
      }

      const categoryName =
        (row.Category && row.Category.trim()) || "Uncategorized";
      const category_id = categoryIdByName[categoryName] ?? defaultCategoryId;

      return {
        user_id: user.id,
        category_id,
        name: row.Name || "",
        minutes,
        notes: row.Notes || null,
        media_links: row["Media Links"] || null,
      };
    });

    // Check for duplicates before inserting
    // TODO: POST-MVP - Implement duplicate handling strategies:
    //   - Skip (current): Filter out duplicates
    //   - Overwrite: Update existing drills with new data
    //   - Rename: Auto-append suffix to make unique
    //   - Merge: Combine data from both versions
    const existingDrills = await supabase
      .from("drills")
      .select("name")
      .eq("user_id", user.id);

    const existingNames = new Set(
      (existingDrills.data || []).map((d) => d.name.toLowerCase())
    );

    // Filter out duplicates (based on name) - current MVP behavior: skip duplicates
    const uniqueDrills = drillsToInsert.filter((drill) => {
      const nameLower = drill.name.toLowerCase();
      if (existingNames.has(nameLower)) {
        return false;
      }
      existingNames.add(nameLower);
      return true;
    });

    if (uniqueDrills.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All drills already exist in your library",
        imported: 0,
        skipped: drillsToInsert.length,
      });
    }

    // Insert drills in batches (Supabase has a limit on batch size)
    const BATCH_SIZE = 100;
    let imported = 0;
    let skipped = drillsToInsert.length - uniqueDrills.length;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < uniqueDrills.length; i += BATCH_SIZE) {
      const batch = uniqueDrills.slice(i, i + BATCH_SIZE);

      const { data, error } = await supabase
        .from("drills")
        .insert(batch)
        .select();

      if (error) {
        // If batch insert fails, try individual inserts to identify problematic rows
        for (let j = 0; j < batch.length; j++) {
          const drill = batch[j];
          const { error: singleError } = await supabase
            .from("drills")
            .insert(drill);

          if (singleError) {
            errors.push({
              row: i + j + 1,
              error: singleError.message,
            });
            skipped++;
          } else {
            imported++;
          }
        }
      } else {
        imported += data?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${imported} drill${
        imported !== 1 ? "s" : ""
      }`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import confirmation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
