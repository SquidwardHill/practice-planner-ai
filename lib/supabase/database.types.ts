// Database types for Supabase tables
// These types match the SQL schema defined in migrations

export type SubscriptionStatus = "trial" | "active" | "cancelled" | "expired";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  shopify_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  trial_end_date: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Drill {
  id: string;
  user_id: string;
  name: string;
  category: string;
  duration: number; // in minutes
  description: string | null;
  steps: string[] | null;
  coaching_points: string[] | null;
  diagram_url: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticePlan {
  id: string;
  user_id: string;
  team_id: string | null;
  title: string;
  total_duration: number | null; // in minutes
  blocks: PracticeBlock[]; // JSONB stored as array
  created_at: string;
  updated_at: string;
}

export interface PracticeBlock {
  time_slot: string;
  drill_name: string;
  category: string;
  duration: number;
  notes: string;
}

// Insert types (omitting auto-generated fields)
export type ProfileInsert = Omit<Profile, "id" | "created_at" | "updated_at">;
export type DrillInsert = Omit<Drill, "id" | "created_at" | "updated_at">;
export type TeamInsert = Omit<Team, "id" | "created_at" | "updated_at">;
export type PracticePlanInsert = Omit<
  PracticePlan,
  "id" | "created_at" | "updated_at"
>;

// Update types (all fields optional except id)
export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">> & {
  id: string;
};
export type DrillUpdate = Partial<Omit<Drill, "id" | "created_at">> & {
  id: string;
};
export type TeamUpdate = Partial<Omit<Team, "id" | "created_at">> & {
  id: string;
};
export type PracticePlanUpdate = Partial<
  Omit<PracticePlan, "id" | "created_at">
> & { id: string };
