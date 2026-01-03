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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get rows from request body
    const body = await request.json();
    const { rows } = body as { rows: DrillImportRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No rows provided" },
        { status: 400 }
      );
    }

    // Transform import rows to database format
    const drillsToInsert = rows.map((row) => ({
      user_id: user.id,
      category: row.Category || "",
      name: row.Name || "",
      minutes:
        row.Minutes !== undefined && row.Minutes !== null
          ? typeof row.Minutes === "string"
            ? parseInt(row.Minutes, 10) || 0
            : row.Minutes
          : 0,
      notes: row.Notes || null,
      media_links: row["Media Links"] || null,
    }));

    // Check for duplicates before inserting
    const existingDrills = await supabase
      .from("drills")
      .select("name")
      .eq("user_id", user.id);

    const existingNames = new Set(
      (existingDrills.data || []).map((d) => d.name.toLowerCase())
    );

    // Filter out duplicates (based on name)
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
      message: `Successfully imported ${imported} drill${imported !== 1 ? "s" : ""}`,
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

