import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function LibraryPage() {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

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
            All drills you've created or imported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Your drill library is empty
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first drill to get started!
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Drill
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
