import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  parseDrillFile,
  validateDrillRow,
  normalizeDrillRow,
} from "@/lib/utils/drill-parser";
import { type DrillImportRow } from "@/lib/types/drill";

/**
 * POST /api/drills/import
 * Parse and validate uploaded drill file
 * Returns parsed data for review before final import
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type - .xlsx (Excel 2007+) supported
    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith(".xlsx");

    if (!isValidExtension) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload a .xlsx file. If you have a .xls file, open it in Excel and save as .xlsx.",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Parse the file
    let rawRows: DrillImportRow[];
    try {
      rawRows = await parseDrillFile(file);
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error
          ? parseError.message
          : "Unknown parsing error";

      console.error("File parsing error:", errorMessage, parseError);

      return NextResponse.json(
        {
          error: "Failed to parse file",
          message: errorMessage,
        },
        { status: 422 }
      );
    }

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { error: "File appears to be empty or has no valid data" },
        { status: 422 }
      );
    }

    // Validate and normalize rows
    // Store both the normalized row and its original index
    const validatedRows: Array<{ row: DrillImportRow; originalIndex: number }> =
      [];
    const errors: Array<{ row: number; error: string }> = [];

    rawRows.forEach((row, index) => {
      const normalized = normalizeDrillRow(row);
      const validation = validateDrillRow(normalized, index);

      if (validation.valid) {
        validatedRows.push({ row: normalized, originalIndex: index });
      } else {
        errors.push({
          row: index + 1,
          error: validation.error || "Unknown validation error",
        });
      }
    });

    // Check for duplicates (same name for this user)
    // TODO: POST-MVP - Add duplicate handling options:
    //   - Skip duplicates (current behavior)
    //   - Overwrite existing drills
    //   - Auto-rename duplicates (e.g., "Drill Name (2)")
    //   - Allow user to choose per-duplicate in UI
    const existingDrills = await supabase
      .from("drills")
      .select("name")
      .eq("user_id", user.id);

    const existingNames = new Set(
      (existingDrills.data || []).map((d) => d.name.toLowerCase())
    );

    const duplicateErrors: Array<{ row: number; error: string }> = [];
    const uniqueRows: DrillImportRow[] = [];

    validatedRows.forEach(({ row, originalIndex }) => {
      const rowNumber = originalIndex + 1; // Convert 0-based index to 1-based row number
      const nameLower = row.Name?.toLowerCase();

      if (nameLower && existingNames.has(nameLower)) {
        duplicateErrors.push({
          row: rowNumber,
          error: `Duplicate drill name: "${row.Name}" already exists in your library`,
        });
      } else {
        uniqueRows.push(row);
        if (nameLower) {
          existingNames.add(nameLower);
        }
      }
    });
    const allErrors = [...errors, ...duplicateErrors];

    return NextResponse.json({
      success: true,
      rows: uniqueRows,
      summary: {
        totalRows: rawRows.length,
        validRows: uniqueRows.length,
        invalidRows: allErrors.length,
        errors: allErrors,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
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
