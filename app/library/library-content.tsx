"use client";

import { Button } from "@/components/ui/button";
import { DrillsDataTable } from "@/components/organisms/drills-data-table";
import { Plus, Lock, HeartCrack } from "lucide-react";
import { type Drill } from "@/lib/types/drill";
import { H1, H4, Lead, P } from "@/components/atoms/typography";
import { DrillImportActions } from "@/components/molecules/drill-import-actions";
import { RequireAccess } from "@/components/organisms/access-control";
import { useUserAccess } from "@/hooks/useUserAccess";
import { SubscriptionRequired } from "@/components/molecules/subscription-required";

interface LibraryContentProps {
  drills: Drill[];
  totalDrills: number;
}

export function LibraryContent({ drills, totalDrills }: LibraryContentProps) {
  const { hasAccess } = useUserAccess();

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
            <Button variant="default" size="default">
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
              <Button variant="default" size="default" className="mt-4">
                Create Drill
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </RequireAccess>
      ) : (
        <DrillsDataTable data={drills} totalRows={totalDrills} />
      )}
    </>
  );
}
