import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { PlannerContent } from "./planner-content";
import type { PracticePlanRow } from "@/components/organisms/practice-plans-data-table";

interface PlannerPageProps {
  searchParams: Promise<{ tab?: string; clear?: string }>;
}

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  const { tab, clear } = await searchParams;
  const initialTab =
    tab === "saved" ? "saved" : ("generate" as "generate" | "saved");
  const clearDraft = clear === "1";

  const supabase = await createClient();
  const { data: plans, error } = await supabase
    .from("practice_plans")
    .select("id, practice_title, total_duration_minutes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching plans:", error);
  }

  const planList: PracticePlanRow[] = plans ?? [];
  const totalPlans = planList.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <PlannerContent
        plans={planList}
        totalPlans={totalPlans}
        initialTab={initialTab}
        clearDraft={clearDraft}
      />
    </div>
  );
}
