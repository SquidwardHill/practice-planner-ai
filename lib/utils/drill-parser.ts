import * as XLSX from "xlsx";
import { type DrillImportRow } from "@/lib/types/drill";

/**
 * Parse Excel file (.xls) and return array of drill rows
 * Works in both browser and Node.js/server environments
 */
export async function parseExcelFile(file: File): Promise<DrillImportRow[]> {
  try {
    // Convert File to ArrayBuffer
    // In Node.js/Next.js API routes, File.arrayBuffer() is available
    // In browsers, we can also use File.arrayBuffer()
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Failed to read file: No data received");
    }

    // XLSX can read from ArrayBuffer
    let workbook;
    try {
      workbook = XLSX.read(arrayBuffer, { type: "array" });
    } catch (readError) {
      throw new Error(
        `Failed to parse Excel file. The file may be corrupted or in an unsupported format. ${
          readError instanceof Error ? readError.message : ""
        }`
      );
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("Excel file contains no sheets");
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      throw new Error("Failed to read the first sheet from the Excel file");
    }

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      defval: null, // Use null for empty cells
      raw: false, // Convert all values to strings
    }) as DrillImportRow[];

    if (!jsonData || jsonData.length === 0) {
      throw new Error(
        "The Excel file appears to be empty or has no data rows. Please ensure the file contains drill data."
      );
    }

    return jsonData;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to parse Excel file: Unknown error occurred");
  }
}

/**
 * Parse .xls file and return array of drill rows
 */
export async function parseDrillFile(file: File): Promise<DrillImportRow[]> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  // Only support .xls files (PracticePlannerLive export format)
  if (!fileName.endsWith(".xls") && fileType !== "application/vnd.ms-excel") {
    throw new Error(
      "Unsupported file type. Please upload a .xls file exported from PracticePlannerLive."
    );
  }

  return parseExcelFile(file);
}

/**
 * Validate a drill import row
 */
export function validateDrillRow(
  row: DrillImportRow,
  rowIndex: number
): { valid: boolean; error?: string } {
  // Check required fields
  if (
    !row.Category ||
    typeof row.Category !== "string" ||
    !row.Category.trim()
  ) {
    return {
      valid: false,
      error: `Row ${rowIndex + 1}: Category is required`,
    };
  }

  if (!row.Name || typeof row.Name !== "string" || !row.Name.trim()) {
    return {
      valid: false,
      error: `Row ${rowIndex + 1}: Name is required`,
    };
  }

  // Validate minutes if provided
  if (row.Minutes !== undefined && row.Minutes !== null && row.Minutes !== "") {
    const minutes =
      typeof row.Minutes === "string" ? parseInt(row.Minutes, 10) : row.Minutes;
    if (isNaN(minutes) || minutes < 0) {
      return {
        valid: false,
        error: `Row ${rowIndex + 1}: Minutes must be a non-negative number`,
      };
    }
  }

  return { valid: true };
}

/**
 * Normalize drill import row data
 */
export function normalizeDrillRow(row: DrillImportRow): DrillImportRow {
  return {
    Category: row.Category?.trim() || "",
    Name: row.Name?.trim() || "",
    Minutes:
      row.Minutes !== undefined && row.Minutes !== null && row.Minutes !== ""
        ? typeof row.Minutes === "string"
          ? parseInt(row.Minutes, 10) || 0
          : row.Minutes
        : undefined,
    Notes: row.Notes?.trim() || undefined,
    "Media Links": row["Media Links"]?.trim() || undefined,
  };
}
