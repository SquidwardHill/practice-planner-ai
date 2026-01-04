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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Drill Library</h1>
          <p className="text-muted-foreground mt-2">
            Manage your collection of practice drills
          </p>
        </div>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Drill
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Drills</CardTitle>
          <CardDescription>
            All drills you've created or imported ({totalDrills} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalDrills === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Your drill library is empty
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Import drills from PracticePlannerLive or create your first
                drill to get started!
              </p>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Drill
              </Button>
            </div>
          ) : (
            <DrillsDataTable data={drillList} totalRows={totalDrills} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
