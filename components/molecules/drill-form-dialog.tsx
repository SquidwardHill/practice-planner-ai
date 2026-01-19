"use client";

import { useState, useEffect } from "react";
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

  // Initialize form when drill changes
  useEffect(() => {
    if (drill) {
      setFormData({
        category: drill.category,
        name: drill.name,
        minutes: drill.minutes || undefined,
        notes: drill.notes || undefined,
        media_links: drill.media_links || undefined,
      });
    } else {
      setFormData({
        category: "",
        name: "",
        minutes: undefined,
        notes: undefined,
        media_links: undefined,
      });
    }
    setError(null);
  }, [drill, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/drills/${drill.id}` : "/api/drills";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              required
            />
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
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media_links">Media Links</Label>
            <Input
              id="media_links"
              value={formData.media_links || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  media_links: e.target.value || undefined,
                })
              }
              placeholder="https://youtube.com/watch?v=..."
            />
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
