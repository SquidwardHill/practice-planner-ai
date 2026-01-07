"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { DrillImportModal } from "@/components/organisms/drill-import-modal";

interface DrillImportActionsProps {
  variant?: "default" | "outline";
  guarded?: boolean;
}

export function DrillImportActions({
  variant = "outline",
  guarded = false,
}: DrillImportActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size="lg"
        className="mr-4"
        guarded={guarded}
        onClick={() => {
          if (!guarded) {
            setIsModalOpen(true);
          }
        }}
      >
        Upload Drill List
        {!guarded ? <Upload className="h-4 w-4" /> : null}
      </Button>

      <DrillImportModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
