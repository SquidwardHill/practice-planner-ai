import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { PlannerContent } from "./planner-content";
import { AskAiTypewriter } from "@/components/molecules/ask-ai-typewriter";
import { PRODUCT_NAME_BASE } from "@/lib/config/branding";
import type { PracticePlanRow } from "@/components/organisms/practice-plans-data-table";

export default async function PlannerPage() {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

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
      <PlannerContent plans={planList} totalPlans={totalPlans} />
    </div>
  );
}
