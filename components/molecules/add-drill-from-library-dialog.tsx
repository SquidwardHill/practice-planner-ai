"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Small } from "@/components/atoms/typography";
import { Search, BookOpen } from "lucide-react";

export interface DrillOption {
  id: string;
  name: string;
  minutes: number;
  notes: string | null;
  category_id: string;
  categories?: { id: string; name: string } | null;
}

export interface AddDrillFromLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (drill: {
    drill_name: string;
    category: string;
    duration: number;
    notes: string;
  }) => void;
}

export function AddDrillFromLibraryDialog({
  open,
  onOpenChange,
  onSelect,
}: AddDrillFromLibraryDialogProps) {
  const [drills, setDrills] = useState<DrillOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setError(null);
    setLoading(true);
    fetch("/api/drills", { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load drills");
        return res.json();
      })
      .then((data: DrillOption[]) => {
        setDrills(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Could not load drill library."))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return drills;
    const q = search.trim().toLowerCase();
    return drills.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.categories?.name ?? "").toLowerCase().includes(q)
    );
  }, [drills, search]);

  const handleSelect = (d: DrillOption) => {
    onSelect({
      drill_name: d.name,
      category: d.categories?.name ?? "—",
      duration: d.minutes || 1,
      notes: d.notes ?? "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add drill from library</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {error && (
            <Small className="text-destructive">{error}</Small>
          )}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <Small className="text-muted-foreground">Loading drills...</Small>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
              <Small className="text-muted-foreground text-center">
                {drills.length === 0
                  ? "Your library is empty. Add drills in Library first."
                  : "No drills match your search."}
              </Small>
            </div>
          ) : (
            <ul className="flex-1 overflow-auto border rounded-md divide-y -mx-1">
              {filtered.map((d) => (
                <li key={d.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start h-auto py-3 px-3 rounded-none text-left font-normal"
                    onClick={() => handleSelect(d)}
                  >
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {d.categories?.name ?? "—"} · {d.minutes || 0} min
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
