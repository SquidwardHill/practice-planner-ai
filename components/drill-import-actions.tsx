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
        className="text-lg px-8 mr-4"
        onClick={() => setIsModalOpen(true)}
      >
        Upload Drill List
        <Upload className="ml-2 h-5 w-5" />
      </Button>
      <Link href="/docs">
        <Button variant="outline" size="lg" className="text-lg px-8">
          Documentation
          <BookOpen className="ml-2 h-5 w-5" />
        </Button>
      </Link>
      <DrillImportModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

