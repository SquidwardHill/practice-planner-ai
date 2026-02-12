import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import * as iconv from "iconv-lite";
import { type DrillImportRow } from "@/lib/types/drill";

/**
 * Parse .xlsx file and return array of drill rows (uses ExcelJS)
 */
export async function parseExcelFile(file: File): Promise<DrillImportRow[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Failed to read file: No data received");
    }

    let workbook: ExcelJS.Workbook;
    try {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
    } catch (readError) {
      throw new Error(
        `Failed to parse Excel file. The file may be corrupted or in an unsupported format. ${
          readError instanceof Error ? readError.message : ""
        }`
      );
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error("Excel file contains no sheets");
    }

    const headerRow = worksheet.getRow(1);
    const headersByCol: Record<number, string> = {};
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const text = cell.text ?? (cell.value != null ? String(cell.value) : "");
      headersByCol[colNumber] = text.trim();
    });

    const rows: DrillImportRow[] = [];
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const rowObj: Record<string, unknown> = {};
      let hasAnyValue = false;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headersByCol[colNumber];
        if (!header) return;
        const val = cell.value;
        if (val != null && val !== "") {
          hasAnyValue = true;
        }
        const text = cell.text;
        if (text !== undefined && text !== null) {
          rowObj[header] = text;
        } else if (typeof val === "number") {
          rowObj[header] = val;
        } else if (val == null || val === "") {
          rowObj[header] = null;
        } else {
          rowObj[header] = String(val);
        }
      });
      if (hasAnyValue) {
        rows.push(rowObj as unknown as DrillImportRow);
      }
    }

    if (rows.length === 0) {
      throw new Error(
        "The Excel file appears to be empty or has no data rows. Please ensure the file contains drill data."
      );
    }

    const fixedData = rows.map((row) => ({
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
 * Parse legacy .xls file and return array of drill rows (uses SheetJS/xlsx)
 */
async function parseXlsFile(file: File): Promise<DrillImportRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error("Failed to read file: No data received");
  }
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellDates: true,
    });
  } catch (readError) {
    throw new Error(
      `Failed to parse .xls file. The file may be corrupted or in an unsupported format. ${
        readError instanceof Error ? readError.message : ""
      }`
    );
  }
  if (!workbook.SheetNames?.length) {
    throw new Error("Excel file contains no sheets");
  }
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) {
    throw new Error("Failed to read the first sheet from the Excel file");
  }
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: false,
    blankrows: false,
  }) as DrillImportRow[];
  if (!jsonData?.length) {
    throw new Error(
      "The Excel file appears to be empty or has no data rows. Please ensure the file contains drill data."
    );
  }
  return jsonData.map((row) => ({
    ...row,
    Category: fixEncoding(row.Category),
    Name: fixEncoding(row.Name),
    Notes: row.Notes ? fixEncoding(row.Notes) : undefined,
    "Media Links": row["Media Links"]
      ? fixEncoding(row["Media Links"])
      : undefined,
  }));
}

/**
 * Parse .xls or .xlsx file and return array of drill rows
 */
export async function parseDrillFile(file: File): Promise<DrillImportRow[]> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  const isXls =
    fileName.endsWith(".xls") ||
    fileType === "application/vnd.ms-excel";

  const isXlsx =
    fileName.endsWith(".xlsx") ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  if (isXls) {
    return parseXlsFile(file);
  }
  if (isXlsx) {
    return parseExcelFile(file);
  }
  throw new Error(
    "Unsupported file type. Please upload a .xls or .xlsx file (e.g. from PracticePlannerLive or our Excel template)."
  );
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
