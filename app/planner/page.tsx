import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { H1, P } from "@/components/atoms/typography";
import { PlannerContent } from "./planner-content";
import { PRODUCT_NAME_BASE } from "@/lib/config/branding";

export default async function PlannerPage() {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12">
        <H1>{PRODUCT_NAME_BASE}</H1>
        <P className="text-muted-foreground mt-1">
          Generate AI-powered practice plans from your drill library
        </P>
      </div>

      <PlannerContent />
    </div>
  );
}
