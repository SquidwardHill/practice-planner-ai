"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, BookOpen } from "lucide-react";
import { DrillImportModal } from "@/components/drill-import-modal";

export function DrillImportActions() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        size="lg"
        className="mr-4"
        onClick={() => setIsModalOpen(true)}
      >
        Upload Drill List
        <Upload className="ml-2 h-4 w-4" />
      </Button>
      <Link href="/docs">
        <Button variant="outline" size="lg">
          Documentation
          <BookOpen className="ml-2 h-4 w-4" />
        </Button>
      </Link>
      <DrillImportModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
