"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  X,
  SaveIcon,
  Save,
  Import,
  FileUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DrillImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DrillImportModal({
  open,
  onOpenChange,
}: DrillImportModalProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Validate file type - only .xls supported
    const validTypes = [
      "application/vnd.ms-excel", // .xls
    ];
    const validExtensions = [".xls"];

    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));

    if (
      !validTypes.includes(selectedFile.type) &&
      !validExtensions.includes(fileExtension)
    ) {
      alert(
        "Invalid file type. Please upload a .xls file exported from PracticePlannerLive."
      );
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFileSelect(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/drills/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // If response is not JSON, use status text
          throw new Error(
            `Upload failed: ${response.statusText || "Unknown error"}`
          );
        }
        throw new Error(
          errorData.message || errorData.error || "Upload failed"
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Store data in sessionStorage for review page
      sessionStorage.setItem(
        "importReviewData",
        JSON.stringify({
          rows: data.rows,
          summary: data.summary,
        })
      );

      // Close modal and redirect to review page
      onOpenChange(false);
      setFile(null);
      window.location.href = "/import/review";
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload file. Please try again.";
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Legacy Drill Migration</DialogTitle>
          <DialogDescription>
            Download your drill data from PracticePlannerLive. Your drills will
            be automatically formatted and imported into your library.
          </DialogDescription>
          <p className="text-base text-muted-foreground/75 pt-2">
            {" "}
            Need more details? Check out our{" "}
            <Link
              className="text-accent/75 underline"
              href="/docs/migration-guide"
            >
              migration guide.
            </Link>
          </p>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* File Upload Area */}
          <div className="space-y-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50",
                file && "border-primary bg-primary/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,application/vnd.ms-excel"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-upload"
              />

              {!file ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports .xls files from PracticePlannerLive (max 10MB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                    <FileUp className="  h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4 gap-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Different File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                Importing...
                <Upload className="  h-4 w-4 animate-pulse" />
              </>
            ) : (
              <>
                Start Import
                <Upload className="  h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
