"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/ui/dialog";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Label } from "@/components/shadcn/ui/label";
import {
  Upload,
  FileText,
  X,
  FileUp,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { P, Small } from "@/components/atoms/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/ui/tabs";

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
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [forceYoutubeRefresh, setForceYoutubeRefresh] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setYoutubeUrl("");
      setForceYoutubeRefresh(false);
    }
  }, [open]);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Validate file type - .xls and .xlsx supported
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".xls", ".xlsx"];

    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));

    if (
      !validTypes.includes(selectedFile.type) &&
      !validExtensions.includes(fileExtension)
    ) {
      alert(
        "Invalid file type. Please upload a .xls or .xlsx file (e.g. from PracticePlannerLive or our Excel template).",
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
            `Upload failed: ${response.statusText || "Unknown error"}`,
          );
        }
        throw new Error(
          errorData.message || errorData.error || "Upload failed",
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
        }),
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

  const handleYoutubeImport = async () => {
    if (!youtubeUrl.trim()) return;

    setIsUploading(true);
    try {
      const response = await fetch("/api/drills/import/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          forceRefresh: forceYoutubeRefresh,
        }),
      });

      if (!response.ok) {
        let errorData: { message?: string; error?: string } = {};
        try {
          errorData = await response.json();
        } catch {
          throw new Error(
            `Import failed: ${response.statusText || "Unknown error"}`,
          );
        }
        throw new Error(
          errorData.message || errorData.error || "YouTube import failed",
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "YouTube import failed");
      }

      sessionStorage.setItem(
        "importReviewData",
        JSON.stringify({
          rows: data.rows,
          summary: data.summary,
          source: "youtube",
          videoUrl: data.videoUrl,
          cached: Boolean(data.cached),
        }),
      );

      onOpenChange(false);
      setYoutubeUrl("");
      setForceYoutubeRefresh(false);
      window.location.href = "/import/review";
    } catch (error) {
      console.error("YouTube import error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to import from YouTube. Please try again.";
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import drills</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet from PracticePlannerLive, or paste a YouTube
            link to extract drills from captions with AI—then review before
            saving to your library.
          </DialogDescription>
          <P className="text-muted-foreground/75 pt-2">
            Need more details? Check out our{" "}
            <Link
              className="text-accent/75 underline"
              href="/docs/migration-guide"
            >
              migration guide.
            </Link>
          </P>
        </DialogHeader>

        <Tabs defaultValue="spreadsheet" className="py-2">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="spreadsheet" className="flex-1">
              Spreadsheet
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex-1 gap-1.5">
              <Youtube className="size-4 shrink-0" />
              YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spreadsheet" className="mt-4 space-y-6">
        <div className="space-y-6">
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
                file && "border-primary bg-primary/5",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                    <P className="font-medium">
                      Drag and drop your file here, or click to browse
                    </P>
                    <Small>Supports .xls and .xlsx files (max 10MB)</Small>
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
                      <P className="font-medium">{file.name}</P>
                      <Small>{(file.size / 1024).toFixed(2)} KB</Small>
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

        <DialogFooter className="gap-2 sm:gap-0">
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
          </TabsContent>

          <TabsContent value="youtube" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={isUploading}
                autoComplete="off"
              />
              <Small className="text-muted-foreground">
                We fetch captions, then AI suggests drill rows. You can edit
                everything on the next screen before saving.
              </Small>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-primary"
                checked={forceYoutubeRefresh}
                onChange={(e) => setForceYoutubeRefresh(e.target.checked)}
                disabled={isUploading}
              />
              Re-run AI (ignore saved cache for this video)
            </label>
            <DialogFooter className="gap-2 sm:gap-0">
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
                onClick={handleYoutubeImport}
                disabled={!youtubeUrl.trim() || isUploading}
              >
                {isUploading ? (
                  <>
                    Processing…
                    <Upload className="h-4 w-4 animate-pulse" />
                  </>
                ) : (
                  <>
                    Extract drills
                    <Youtube className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
