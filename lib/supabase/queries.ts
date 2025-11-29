// Database query helper functions
// These functions provide type-safe database operations

import { supabase as serverSupabase } from "./server";
import { supabase as clientSupabase } from "./client";
import type {
  Profile,
  Drill,
  Team,
  PracticePlan,
  DrillInsert,
  TeamInsert,
  PracticePlanInsert,
  DrillUpdate,
  TeamUpdate,
  PracticePlanUpdate,
} from "./database.types";

// ============================================
// PROFILE QUERIES
// ============================================

/**
 * Get user profile by user ID (server-side only)
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await serverSupabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as Profile;
}

/**
 * Update user profile (server-side only)
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
): Promise<Profile | null> {
  const { data, error } = await serverSupabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }

  return data as Profile;
}

/**
 * Check if user has active subscription or valid trial
 */
export async function hasActiveAccess(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  if (!profile) return false;

  const now = new Date();

  // Check subscription status
  if (profile.subscription_status === "active") {
    if (profile.subscription_end_date) {
      const endDate = new Date(profile.subscription_end_date);
      return endDate > now;
    }
    return true;
  }

  // Check trial status
  if (profile.subscription_status === "trial" && profile.trial_end_date) {
    const trialEnd = new Date(profile.trial_end_date);
    return trialEnd > now;
  }

  return false;
}

// ============================================
// DRILL QUERIES
// ============================================

/**
 * Get all drills for a user
 */
export async function getUserDrills(userId: string): Promise<Drill[]> {
  const { data, error } = await serverSupabase
    .from("drills")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching drills:", error);
    return [];
  }

  return (data || []) as Drill[];
}

/**
 * Get drills by category
 */
export async function getDrillsByCategory(
  userId: string,
  category: string
): Promise<Drill[]> {
  const { data, error } = await serverSupabase
    .from("drills")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching drills by category:", error);
    return [];
  }

  return (data || []) as Drill[];
}

/**
 * Get a single drill by ID
 */
export async function getDrill(
  drillId: string,
  userId: string
): Promise<Drill | null> {
  const { data, error } = await serverSupabase
    .from("drills")
    .select("*")
    .eq("id", drillId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching drill:", error);
    return null;
  }

  return data as Drill;
}

/**
 * Create a new drill
 */
export async function createDrill(
  userId: string,
  drill: DrillInsert
): Promise<Drill | null> {
  const { data, error } = await serverSupabase
    .from("drills")
    .insert({ ...drill, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error("Error creating drill:", error);
    return null;
  }

  return data as Drill;
}

/**
 * Update a drill
 */
export async function updateDrill(
  drillId: string,
  userId: string,
  updates: Partial<Omit<Drill, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<Drill | null> {
  const { data, error } = await serverSupabase
    .from("drills")
    .update(updates)
    .eq("id", drillId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating drill:", error);
    return null;
  }

  return data as Drill;
}

/**
 * Delete a drill
 */
export async function deleteDrill(
  drillId: string,
  userId: string
): Promise<boolean> {
  const { error } = await serverSupabase
    .from("drills")
    .delete()
    .eq("id", drillId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting drill:", error);
    return false;
  }

  return true;
}

/**
 * Bulk insert drills (for CSV import)
 */
export async function bulkInsertDrills(
  userId: string,
  drills: DrillInsert[]
): Promise<{ success: number; errors: number }> {
  const drillsWithUserId = drills.map((drill) => ({
    ...drill,
    user_id: userId,
  }));

  const { data, error } = await serverSupabase
    .from("drills")
    .insert(drillsWithUserId)
    .select();

  if (error) {
    console.error("Error bulk inserting drills:", error);
    return { success: 0, errors: drills.length };
  }

  return {
    success: data?.length || 0,
    errors: drills.length - (data?.length || 0),
  };
}

// ============================================
// TEAM QUERIES
// ============================================

/**
 * Get all teams for a user
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  const { data, error } = await serverSupabase
    .from("teams")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching teams:", error);
    return [];
  }

  return (data || []) as Team[];
}

/**
 * Get a single team by ID
 */
export async function getTeam(
  teamId: string,
  userId: string
): Promise<Team | null> {
  const { data, error } = await serverSupabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching team:", error);
    return null;
  }

  return data as Team;
}

/**
 * Create a new team
 */
export async function createTeam(
  userId: string,
  team: TeamInsert
): Promise<Team | null> {
  const { data, error } = await serverSupabase
    .from("teams")
    .insert({ ...team, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error("Error creating team:", error);
    return null;
  }

  return data as Team;
}

/**
 * Update a team
 */
export async function updateTeam(
  teamId: string,
  userId: string,
  updates: Partial<Omit<Team, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<Team | null> {
  const { data, error } = await serverSupabase
    .from("teams")
    .update(updates)
    .eq("id", teamId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating team:", error);
    return null;
  }

  return data as Team;
}

/**
 * Delete a team
 */
export async function deleteTeam(
  teamId: string,
  userId: string
): Promise<boolean> {
  const { error } = await serverSupabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting team:", error);
    return false;
  }

  return true;
}

// ============================================
// PRACTICE PLAN QUERIES
// ============================================

/**
 * Get all practice plans for a user
 */
export async function getUserPracticePlans(
  userId: string
): Promise<PracticePlan[]> {
  const { data, error } = await serverSupabase
    .from("practice_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching practice plans:", error);
    return [];
  }

  return (data || []) as PracticePlan[];
}

/**
 * Get a single practice plan by ID
 */
export async function getPracticePlan(
  planId: string,
  userId: string
): Promise<PracticePlan | null> {
  const { data, error } = await serverSupabase
    .from("practice_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching practice plan:", error);
    return null;
  }

  return data as PracticePlan;
}

/**
 * Create a new practice plan
 */
export async function createPracticePlan(
  userId: string,
  plan: PracticePlanInsert
): Promise<PracticePlan | null> {
  const { data, error } = await serverSupabase
    .from("practice_plans")
    .insert({ ...plan, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error("Error creating practice plan:", error);
    return null;
  }

  return data as PracticePlan;
}

/**
 * Update a practice plan
 */
export async function updatePracticePlan(
  planId: string,
  userId: string,
  updates: Partial<
    Omit<PracticePlan, "id" | "user_id" | "created_at" | "updated_at">
  >
): Promise<PracticePlan | null> {
  const { data, error } = await serverSupabase
    .from("practice_plans")
    .update(updates)
    .eq("id", planId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating practice plan:", error);
    return null;
  }

  return data as PracticePlan;
}

/**
 * Delete a practice plan
 */
export async function deletePracticePlan(
  planId: string,
  userId: string
): Promise<boolean> {
  const { error } = await serverSupabase
    .from("practice_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting practice plan:", error);
    return false;
  }

  return true;
}
