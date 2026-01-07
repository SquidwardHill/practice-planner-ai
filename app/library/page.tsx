import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DrillsDataTable } from "@/components/drills-data-table";
import { Plus } from "lucide-react";
import { type Drill } from "@/lib/types/drill";
import { Suspense } from "react";
import { LibraryContent } from "./library-content";
import { ImportSuccessMessage } from "@/components/molecules/import-success-message";

export default async function LibraryPage() {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all drills from database (TanStack Table handles pagination client-side)
  const supabase = await createClient();
  const {
    data: drills,
    error,
    count,
  } = await supabase
    .from("drills")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching drills:", error);
  }

  const drillList: Drill[] = drills || [];
  const totalDrills = count || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <H1>Drill Library</H1>
          <P className="text-muted-foreground mt-1">
            {totalDrills === 0
              ? "Your drill library is empty"
              : `${totalDrills} drill${
                  totalDrills !== 1 ? "s" : ""
                } in your library`}
          </P>
        </div>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Drill
        </Button>
      </div>

      {totalDrills === 0 ? (
        <div className="text-center py-16">
          <P className="text-muted-foreground mb-2">
            Import drills from PracticePlannerLive or create your first drill to
            get started
          </P>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Drill
          </Button>
        </div>
      ) : (
        <DrillsDataTable data={drillList} totalRows={totalDrills} />
      )}
    </div>
  );
}
