export interface Drill {
  id: string;
  user_id: string;
  category: string;
  name: string;
  minutes: number;
  notes: string | null;
  media_links: string | null;
  created_at: string;
  updated_at: string;
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
  category: string;
  name: string;
  minutes?: number;
  notes?: string;
  media_links?: string;
}

// Drill update input
export interface UpdateDrillInput {
  category?: string;
  name?: string;
  minutes?: number;
  notes?: string;
  media_links?: string;
}

