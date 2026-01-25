"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Drill, type CreateDrillInput, type UpdateDrillInput } from "@/lib/types/drill";
import { Upload, X, File, Image, Video, FileText, Link2, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drill?: Drill | null;
  onSuccess?: () => void;
}

// Common drill categories
const DRILL_CATEGORIES = [
  "Warmup",
  "Shooting",
  "Defense",
  "Offense",
  "Transition",
  "Rebounding",
  "Conditioning",
  "Live Play",
  "Rest",
  "Other",
];

export function DrillFormDialog({
  open,
  onOpenChange,
  drill,
  onSuccess,
}: DrillFormDialogProps) {
  const router = useRouter();
  const isEditing = !!drill;

  const [formData, setFormData] = useState<CreateDrillInput>({
    category: "",
    name: "",
    minutes: undefined,
    notes: undefined,
    media_links: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<Array<{ url: string; name: string }>>([]);
  const [otherLinks, setOtherLinks] = useState<Array<{ url: string; name: string }>>([]);
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; name: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions to categorize media
  const isYouTubeUrl = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes("youtube.com") ||
      lowerUrl.includes("youtu.be") ||
      lowerUrl.includes("youtube.com/embed") ||
      lowerUrl.includes("m.youtube.com")
    );
  };

  const isUploadedFile = (url: string): boolean => {
    // Check if it's a Supabase storage URL
    return url.includes("supabase.co/storage") || url.includes("supabase.co/storage/v1/object/public");
  };

  // Initialize form when drill changes
  useEffect(() => {
    if (drill) {
      // Parse and categorize media links
      const mediaLinks = drill.media_links
        ? drill.media_links.split(",").map((link) => link.trim()).filter(Boolean)
        : [];

      const uploaded: Array<{ url: string; name: string }> = [];
      const youtube: Array<{ url: string; name: string }> = [];
      const other: Array<{ url: string; name: string }> = [];

      mediaLinks.forEach((url) => {
        const fileName = url.split("/").pop()?.split("?")[0] || url;
        const item = { url, name: fileName };

        if (isYouTubeUrl(url)) {
          youtube.push(item);
        } else if (isUploadedFile(url)) {
          uploaded.push(item);
        } else {
          other.push(item);
        }
      });

      setFormData({
        category: drill.category,
        name: drill.name,
        minutes: drill.minutes || undefined,
        notes: drill.notes || undefined,
        media_links: undefined, // Clear manual URL entry
      });
      setUploadedFiles(uploaded);
      setYoutubeLinks(youtube);
      setOtherLinks(other);
    } else {
      setFormData({
        category: "",
        name: "",
        minutes: undefined,
        notes: undefined,
        media_links: undefined,
      });
      setUploadedFiles([]);
      setYoutubeLinks([]);
      setOtherLinks([]);
      setPendingFiles([]);
    }
    setError(null);
  }, [drill, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const newPendingFiles = fileArray.map((file) => ({
        file,
        name: file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as default
      }));
      setPendingFiles((prev) => [...prev, ...newPendingFiles]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updatePendingFileName = (index: number, name: string) => {
    setPendingFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name } : item))
    );
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      const fileNames: string[] = [];
      
      pendingFiles.forEach(({ file, name }) => {
        formData.append("files", file);
        formData.append("fileNames", name); // Send friendly names
      });

      const response = await fetch("/api/drills/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Upload failed:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        throw new Error(
          data.error || data.details || "Failed to upload files"
        );
      }

      console.log("Upload successful:", {
        urls: data.urls,
        uploaded: data.uploaded,
        errors: data.errors,
      });

      // Add new URLs with friendly names to uploaded files
      const newUploadedFiles = data.urls.map((url: string, index: number) => ({
        url,
        name: pendingFiles[index]?.name || url.split("/").pop() || "File",
      }));
      
      setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
      setPendingFiles([]); // Clear pending files after upload
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const newPendingFiles = fileArray.map((file) => ({
        file,
        name: file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as default
      }));
      setPendingFiles((prev) => [...prev, ...newPendingFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeYoutubeLink = (index: number) => {
    setYoutubeLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const removeOtherLink = (index: number) => {
    setOtherLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateYoutubeLinkName = (index: number, name: string) => {
    setYoutubeLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name } : item))
    );
  };

  const updateOtherLinkName = (index: number, name: string) => {
    setOtherLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name } : item))
    );
  };

  const updateUploadedFileName = (index: number, name: string) => {
    setUploadedFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name } : item))
    );
  };

  const getFileIcon = (fileNameOrUrl: string) => {
    if (fileNameOrUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image className="h-4 w-4" />;
    }
    if (fileNameOrUrl.match(/\.(mp4|mov|webm|mpeg)$/i)) {
      return <Video className="h-4 w-4" />;
    }
    if (fileNameOrUrl.match(/\.(pdf)$/i)) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/drills/${drill.id}` : "/api/drills";
      const method = isEditing ? "PATCH" : "POST";

      // Combine all media types
      const manualUrl = formData.media_links?.trim();
      const allMediaLinks = [
        ...uploadedFiles.map((f) => f.url),
        ...youtubeLinks.map((f) => f.url),
        ...otherLinks.map((f) => f.url),
        ...(manualUrl ? [manualUrl] : []),
      ].filter(Boolean);

      const submitData = {
        ...formData,
        media_links: allMediaLinks.length > 0 ? allMediaLinks.join(", ") : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save drill");
      }

      // Success - close dialog and refresh
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Clear all media when dialog closes
      setUploadedFiles([]);
      setYoutubeLinks([]);
      setOtherLinks([]);
      setPendingFiles([]);
      setFormData({
        category: "",
        name: "",
        minutes: undefined,
        notes: undefined,
        media_links: undefined,
      });
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Drill" : "Create Drill"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the drill details below."
              : "Fill in the details to create a new drill."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {DRILL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                value={formData.minutes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minutes: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                placeholder="e.g., 10"
                className="placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., 3-Man Weave"
              className="placeholder:text-muted-foreground/40"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value || undefined })
              }
              placeholder="Additional notes or instructions..."
              className="placeholder:text-muted-foreground/40"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media">Media</Label>
            
            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="media-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isUploading
                    ? "Uploading..."
                    : "Click to upload or drag and drop"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Images, videos, or PDFs (max 50MB each)
                </span>
              </label>
            </div>

            {/* Pending Files List (before upload) */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Files to Upload ({pendingFiles.length})
                </Label>
                <div className="space-y-2">
                  {pendingFiles.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
                    >
                      {getFileIcon(item.file.name)}
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updatePendingFileName(index, e.target.value)
                        }
                        placeholder="Enter friendly name..."
                        className="flex-1 h-8 text-sm placeholder:text-muted-foreground/40"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removePendingFile(index)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? "Uploading..." : `Upload ${pendingFiles.length} file${pendingFiles.length !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Uploaded Files ({uploadedFiles.length})
                </Label>
                <div className="space-y-1">
                  {uploadedFiles.map((fileItem, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
                    >
                      {getFileIcon(fileItem.url)}
                      <Input
                        value={fileItem.name}
                        onChange={(e) =>
                          updateUploadedFileName(index, e.target.value)
                        }
                        className="flex-1 h-8 text-sm"
                      />
                      <a
                        href={fileItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title="Open file"
                      >
                        <File className="h-4 w-4" />
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube Links List */}
            {youtubeLinks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Youtube className="h-3 w-3" />
                  YouTube Links ({youtubeLinks.length})
                </Label>
                <div className="space-y-1">
                  {youtubeLinks.map((linkItem, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
                    >
                      <Youtube className="h-4 w-4 text-red-500" />
                      <Input
                        value={linkItem.name}
                        onChange={(e) =>
                          updateYoutubeLinkName(index, e.target.value)
                        }
                        className="flex-1 h-8 text-sm placeholder:text-muted-foreground/40"
                        placeholder="Video title..."
                      />
                      <a
                        href={linkItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title="Open YouTube link"
                      >
                        <Link2 className="h-4 w-4" />
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeYoutubeLink(index)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Links List */}
            {otherLinks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Other Links ({otherLinks.length})
                </Label>
                <div className="space-y-1">
                  {otherLinks.map((linkItem, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
                    >
                      <Link2 className="h-4 w-4" />
                      <Input
                        value={linkItem.name}
                        onChange={(e) =>
                          updateOtherLinkName(index, e.target.value)
                        }
                        className="flex-1 h-8 text-sm placeholder:text-muted-foreground/40"
                        placeholder="Link title..."
                      />
                      <a
                        href={linkItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title="Open link"
                      >
                        <Link2 className="h-4 w-4" />
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeOtherLink(index)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual URL Entry */}
            <div className="space-y-2">
              <Label htmlFor="media_links" className="text-xs text-muted-foreground">
                Add URL (YouTube or other link)
              </Label>
              <Input
                id="media_links"
                value={formData.media_links || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    media_links: e.target.value || undefined,
                  })
                }
                placeholder="https://youtube.com/watch?v=... or https://example.com"
                className="placeholder:text-muted-foreground/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formData.media_links?.trim()) {
                    e.preventDefault();
                    const url = formData.media_links.trim();
                    const fileName = url.split("/").pop()?.split("?")[0] || url;
                    const item = { url, name: fileName };

                    if (isYouTubeUrl(url)) {
                      setYoutubeLinks((prev) => [...prev, item]);
                    } else {
                      setOtherLinks((prev) => [...prev, item]);
                    }
                    setFormData({ ...formData, media_links: undefined });
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Press Enter to add the URL
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Drill"
                  : "Create Drill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
