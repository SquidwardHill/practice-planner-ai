import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { type Drill } from "@/lib/types/drill";
import { Suspense } from "react";
import { LibraryContent } from "./library-content";
import { ImportSuccessMessage } from "@/components/molecules/import-success-message";

export default async function LibraryPage() {
  const { user, access } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all drills with category name (TanStack Table handles pagination and sorting client-side)
  const supabase = await createClient();
  const {
    data: drills,
    error,
    count,
  } = await supabase
    .from("drills")
    .select("*, categories(id, name)", { count: "exact" })
    .eq("user_id", user.id)
    .order("category_id", { ascending: true })
    .order("name", { ascending: true }); // Secondary sort by name for stable ordering

  if (error) {
    console.error("Error fetching drills:", error);
  }

  const drillList: Drill[] = drills || [];
  const totalDrills = count || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={null}>
        <ImportSuccessMessage />
      </Suspense>
      <LibraryContent drills={drillList} totalDrills={totalDrills} />
    </div>
  );
}
