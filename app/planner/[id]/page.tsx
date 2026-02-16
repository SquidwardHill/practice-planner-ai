import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { PlanEditor } from "@/components/molecules/plan-editor";

interface EditPlanPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <PlanEditor planId={id} />
    </div>
  );
}
