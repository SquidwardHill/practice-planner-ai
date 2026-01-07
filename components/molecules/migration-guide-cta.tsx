"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";
import { DrillImportModal } from "@/components/organisms/drill-import-modal";
import { useUserAccess } from "@/hooks/useUserAccess";

export function MigrationGuideCTA() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasAccess } = useUserAccess();

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Ready to Import Your Drills?
              </h3>
              <p className="text-base text-muted-foreground mb-4">
                Upload your drill list file to get started.
              </p>
              <Button onClick={() => setIsModalOpen(true)} guarded={!hasAccess}>
                Upload Drill List
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <DrillImportModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
