"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DrillsDataTable } from "@/components/organisms/drills-data-table";
import { Plus, Lock, HeartCrack } from "lucide-react";
import { type Drill } from "@/lib/types/drill";
import { H1, H4, Lead, P } from "@/components/atoms/typography";
import { DrillImportActions } from "@/components/molecules/drill-import-actions";
import { RequireAccess } from "@/components/organisms/access-control";
import { useUserAccess } from "@/hooks/useUserAccess";
import { SubscriptionRequired } from "@/components/molecules/subscription-required";
import { DrillFormDialog } from "@/components/molecules/drill-form-dialog";

interface LibraryContentProps {
  drills: Drill[];
  totalDrills: number;
}

export function LibraryContent({ drills, totalDrills }: LibraryContentProps) {
  const { hasAccess } = useUserAccess();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateClick = () => {
    setEditingDrill(null);
    setDialogOpen(true);
  };

  const handleEdit = (drill: Drill) => {
    setEditingDrill(drill);
    setDialogOpen(true);
  };

  const handleDelete = async (drill: Drill) => {
    if (
      !confirm(
        `Are you sure you want to delete "${drill.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(drill.id);
    try {
      const response = await fetch(`/api/drills/${drill.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete drill");
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to delete drill"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="mb-12 flex items-center justify-between">
        <div>
          <H1 className="mb-2">Drill Library</H1>
          {totalDrills === 0 ? (
            <Lead>
              <span>Your drill library is empty</span>{" "}
              <HeartCrack className="w-5 h-5 inline-block ml-1" />
            </Lead>
          ) : (
            <P className="text-muted-foreground mt-1 flex gap-2 items-center">
              {totalDrills} drills in your library
            </P>
          )}
        </div>
        <div className="flex gap-4">
          <RequireAccess
            fallback={
              <Button variant="default" size="default" disabled>
                <span>Create Drill</span>
                <Lock />
              </Button>
            }
          >
            <Button variant="default" size="default" onClick={handleCreateClick}>
              Create Drill
              <Plus className="h-4 w-4" />
            </Button>
          </RequireAccess>
          <DrillImportActions guarded={!hasAccess} />
        </div>
      </div>

      {totalDrills === 0 ? (
        <RequireAccess
          fallback={
            <SubscriptionRequired message="Subscribe to unlock your drill library" />
          }
        >
          <div className="text-center py-16 border rounded-lg p-8">
            <div className="space-y-4">
              <P className="text-muted-foreground mb-2">
                Import drills from PracticePlannerLive or create your first
                drill to get started
              </P>
              <Button
                variant="default"
                size="default"
                className="mt-4"
                onClick={handleCreateClick}
              >
                Create Drill
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </RequireAccess>
      ) : (
        <DrillsDataTable
          data={drills}
          totalRows={totalDrills}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <DrillFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        drill={editingDrill}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
}
