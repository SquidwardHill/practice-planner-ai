"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DrillFormDialog } from "@/components/molecules/drill-form-dialog";
import { type Drill } from "@/lib/types/drill";
import { Pencil } from "lucide-react";

interface DrillEditButtonProps {
  drill: Drill;
}

export function DrillEditButton({ drill }: DrillEditButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit Drill
      </Button>
      <DrillFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        drill={drill}
        onSuccess={handleSuccess}
      />
    </>
  );
}
