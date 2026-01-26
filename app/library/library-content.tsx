"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DrillsDataTable } from "@/components/organisms/drills-data-table";
import { Plus, Lock, BookOpen } from "lucide-react";
import { type Drill } from "@/lib/types/drill";
import { H1, H4, Lead, P } from "@/components/atoms/typography";
import { DrillImportActions } from "@/components/molecules/drill-import-actions";
import { RequireAccess } from "@/components/organisms/access-control";
import { useUserAccess } from "@/hooks/useUserAccess";
import { SubscriptionRequired } from "@/components/molecules/subscription-required";
import { DrillFormDialog } from "@/components/molecules/drill-form-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

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
              Your drill library is empty
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
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Your drill library is empty</EmptyTitle>
              <EmptyDescription>
                Import drills from PracticePlannerLive or create your first drill to get started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="default"
                size="default"
                onClick={handleCreateClick}
              >
                Create Drill
                <Plus className="h-4 w-4 ml-2" />
              </Button>
            </EmptyContent>
          </Empty>
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
