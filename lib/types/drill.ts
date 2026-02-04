export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Drill {
  id: string;
  user_id: string;
  category_id: string;
  /** Category name (from join); present when drills are fetched with categories */
  categories?: { id: string; name: string } | null;
  name: string;
  minutes: number;
  notes: string | null;
  media_links: string | null;
  created_at: string;
  updated_at: string;
}

/** Helper: get display name for drill category (from join or fallback) */
export function getDrillCategoryName(drill: Drill): string {
  return drill.categories?.name ?? "—";
}

// Raw import row structure from XLS/CSV
export interface DrillImportRow {
  Category: string;
  Name: string;
  Minutes?: number | string;
  Notes?: string;
  "Media Links"?: string;
}

// Import result summary
export interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  message?: string;
}

// Drill creation input (for API/forms)
export interface CreateDrillInput {
  category_id: string;
  name: string;
  minutes?: number;
  notes?: string;
  media_links?: string;
}

// Drill update input
export interface UpdateDrillInput {
  category_id?: string;
  name?: string;
  minutes?: number;
  notes?: string | null;
  media_links?: string | null;
}
