import * as XLSX from "xlsx";
import * as iconv from "iconv-lite";
import { type DrillImportRow } from "@/lib/types/drill";

/**
 * Parse Excel file (.xls) and return array of drill rows
 * Works in both browser and Node.js/server environments
 *
 * Note: For Excel files (binary format), we use arrayBuffer() to read the raw binary data.
 * For text files (CSV, TXT), you would use file.text() which reads as UTF-8 by default:
 *   const text = await file.text(); // Automatically UTF-8 in modern browsers/Node.js
 *
 * The XLSX library handles the binary Excel format and extracts text from cells.
 * Encoding issues occur when Excel files were saved with Windows-1252 encoding
 * but are being interpreted as UTF-8, which we fix with iconv-lite.
 */
export async function parseExcelFile(file: File): Promise<DrillImportRow[]> {
  try {
    // For Excel files (binary format), read as ArrayBuffer
    // For text files, you would use: await file.text() (reads as UTF-8)
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Failed to read file: No data received");
    }

    // XLSX library handles encoding internally - let it auto-detect
    // SheetJS automatically handles UTF-8 encoding/decoding when converting to JSON
    // No need to specify codepage - the library detects it from the file
    let workbook;
    try {
      workbook = XLSX.read(arrayBuffer, {
        type: "array",
        // Let XLSX auto-detect encoding - it handles UTF-8 internally
        // Only specify options that affect parsing behavior
        cellDates: true, // Parse dates as Date objects
      });
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

    // Convert to JSON - XLSX handles UTF-8 encoding internally
    // The library automatically decodes cell text with proper encoding
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      defval: null, // Use null for empty cells
      raw: false, // Convert all values to strings (XLSX handles encoding here)
      blankrows: false, // Skip blank rows
    }) as DrillImportRow[];

    if (!jsonData || jsonData.length === 0) {
      throw new Error(
        "The Excel file appears to be empty or has no data rows. Please ensure the file contains drill data."
      );
    }

    // Fix encoding issues in all string fields
    const fixedData = jsonData.map((row) => ({
      ...row,
      Category: fixEncoding(row.Category),
      Name: fixEncoding(row.Name),
      Notes: row.Notes ? fixEncoding(row.Notes) : undefined,
      "Media Links": row["Media Links"]
        ? fixEncoding(row["Media Links"])
        : undefined,
    }));

    return fixedData;
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
 * Fix encoding issues in strings (Windows-1252 to UTF-8)
 * Uses iconv-lite as a fallback when XLSX library doesn't handle encoding correctly
 *
 * Note: XLSX (SheetJS) should handle encoding automatically, but some legacy Excel files
 * saved with Windows-1252 encoding may still have issues. This function serves as a
 * safety net to fix any encoding problems that slip through.
 *
 * The issue: Some Excel files saved with Windows-1252 encoding are incorrectly decoded,
 * resulting in garbled characters like "â€"" instead of proper Unicode characters.
 *
 * Solution: Re-encode the string as Latin1 (preserves byte values), then
 * decode it correctly as Windows-1252, which will produce proper UTF-8 characters.
 *
 * @internal Exported for testing purposes
 */
export function fixEncoding(str: string | null | undefined): string {
  if (!str || typeof str !== "string") return "";

  // Check if the string contains Windows-1252 encoding artifacts
  // These patterns indicate the string was incorrectly decoded
  const hasEncodingIssues = /â[€"'"œ"¢¦]|â€|â€™|â€œ|â€|â€¢|â€¦/.test(str);
  
  // Also check for standalone "â" characters that are likely encoding issues
  // "â" (U+00E2) often appears when a dash or other character was mis-encoded
  const hasStandaloneA = /[^a-z]â[^a-z€"'"œ"¢¦]/.test(str);

  // Always try to fix encoding issues using iconv-lite first
  try {
    // The string was incorrectly decoded as UTF-8 when it should have been Windows-1252
    // To fix: encode it back to bytes (using Latin1 which preserves byte values),
    // then decode it correctly as Windows-1252
    const buffer = Buffer.from(str, "latin1");
    const converted = iconv.decode(buffer, "win1252");
    
    // If conversion changed the string, use it (indicates encoding issue was fixed)
    if (converted !== str) {
      return converted;
    }
    
    // If no change from iconv but we detected issues, try manual replacements
    if (hasEncodingIssues || hasStandaloneA) {
      return converted
        .replace(/â€"/g, "—") // em dash
        .replace(/â€"/g, "–") // en dash
        .replace(/â€™/g, "'") // apostrophe
        .replace(/â€œ/g, '"') // left double quote
        .replace(/â€/g, '"') // right double quote
        .replace(/â€¢/g, "•") // bullet
        .replace(/â€¦/g, "…") // ellipsis
        .replace(/\sâ\s/g, " — ") // " â " -> " — " (space around)
        .replace(/\sâ(?=[A-Za-z])/g, " —") // " â" before letter -> " —"
        .replace(/â\s/g, "— ") // "â " -> "— "
        .replace(/â(?=[A-Za-z])/g, "—") // "â" before letter -> "—" (most common case)
        .replace(/â(?=\s)/g, "—") // "â" before space -> "—"
        .replace(/â/g, "—"); // catch-all: any remaining "â" -> "—"
    }
    
    return converted;
  } catch (error) {
    // Fallback to manual replacement if iconv fails
    console.warn("Encoding conversion failed, using fallback:", error);
    return str
      .replace(/â€"/g, "—") // em dash
      .replace(/â€"/g, "–") // en dash
      .replace(/â€™/g, "'") // apostrophe
      .replace(/â€œ/g, '"') // left double quote
      .replace(/â€/g, '"') // right double quote
      .replace(/â€¢/g, "•") // bullet
      .replace(/â€¦/g, "…") // ellipsis
      .replace(/\sâ\s/g, " — ") // " â " -> " — "
      .replace(/\sâ(?=[A-Za-z])/g, " —") // " â" before letter -> " —"
      .replace(/â\s/g, "— ") // "â " -> "— "
      .replace(/â(?=[A-Za-z])/g, "—") // "â" before letter -> "—"
      .replace(/â(?=\s)/g, "—") // "â" before space -> "—"
      .replace(/â/g, "—"); // catch-all: any remaining "â" -> "—"
  }
}

/**
 * Normalize drill import row data
 */
export function normalizeDrillRow(row: DrillImportRow): DrillImportRow {
  return {
    Category: fixEncoding(row.Category?.trim() || ""),
    Name: fixEncoding(row.Name?.trim() || ""),
    Minutes:
      row.Minutes !== undefined && row.Minutes !== null && row.Minutes !== ""
        ? typeof row.Minutes === "string"
          ? parseInt(row.Minutes, 10) || 0
          : row.Minutes
        : undefined,
    Notes: row.Notes ? fixEncoding(row.Notes.trim()) : undefined,
    "Media Links": row["Media Links"]
      ? fixEncoding(row["Media Links"].trim())
      : undefined,
  };
}
