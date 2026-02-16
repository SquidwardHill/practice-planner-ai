"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { H2, P, Small } from "@/components/atoms/typography";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
  Check,
  X,
  Save,
  GripVertical,
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { AddDrillFromLibraryDialog } from "@/components/molecules/add-drill-from-library-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PracticeBlock {
  time_slot: string;
  drill_name: string;
  category: string;
  duration: number;
  notes: string;
}

interface PracticePlan {
  practice_title: string;
  total_duration_minutes: number;
  blocks: PracticeBlock[];
}

function recalcTimeSlots(blocks: PracticeBlock[]): PracticeBlock[] {
  let startMin = 0;
  return blocks.map((block) => {
    const endMin = startMin + block.duration;
    const time_slot = `${startMin}:00 - ${endMin}:00`;
    startMin = endMin;
    return { ...block, time_slot };
  });
}

function titleWithDuration(
  originalTitle: string,
  totalMinutes: number,
): string {
  const match = originalTitle.match(/^\d+(\s*[-–—]?\s*[Mm]in(?:ute)?s?)?/);
  if (match) {
    const suffix = match[1] ?? " minutes ";
    const rest = originalTitle.slice(match[0].length).trim();
    return `${totalMinutes}${suffix} ${rest}`.replace(/\s+/g, " ").trim();
  }
  return `${originalTitle} (${totalMinutes} minutes)`;
}

const AUTO_SAVE_DEBOUNCE_MS = 1800;

export interface PlanEditorProps {
  planId: string;
}

export function PlanEditor({ planId }: PlanEditorProps) {
  const router = useRouter();
  const [practicePlan, setPracticePlan] = useState<PracticePlan | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<PracticeBlock | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [addDrillOpen, setAddDrillOpen] = useState(false);
  const [futureScheduleEntries, setFutureScheduleEntries] = useState<
    { id: string; scheduled_date: string }[]
  >([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [pendingNewPlanId, setPendingNewPlanId] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState<
    Date | undefined
  >(undefined);
  const [scheduling, setScheduling] = useState(false);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!saveSuccess) return;
    successHideTimeoutRef.current = setTimeout(
      () => setSaveSuccess(false),
      5000,
    );
    return () => {
      if (successHideTimeoutRef.current) {
        clearTimeout(successHideTimeoutRef.current);
        successHideTimeoutRef.current = null;
      }
    };
  }, [saveSuccess]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/plans/${planId}`, {
          credentials: "same-origin",
        });
        if (!res.ok || cancelled) {
          if (!cancelled)
            setError(
              res.status === 404 ? "Plan not found" : "Failed to load plan",
            );
          return;
        }
        const data = (await res.json()) as {
          id: string;
          practice_title: string;
          total_duration_minutes: number;
          blocks: PracticeBlock[];
          created_at?: string;
        };
        if (!data?.blocks?.length || cancelled) return;
        const withSlots = recalcTimeSlots(
          data.blocks.map((b) => ({
            time_slot: b.time_slot ?? "",
            drill_name: b.drill_name ?? "",
            category: b.category ?? "",
            duration: Number(b.duration) || 0,
            notes: b.notes ?? "",
          })),
        );
        setPracticePlan({
          practice_title: data.practice_title ?? "",
          total_duration_minutes: data.total_duration_minutes ?? 0,
          blocks: withSlots,
        });
        setPlanCreatedAt(data.created_at ?? null);
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load plan");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  useEffect(() => {
    if (!planId || !practicePlan) return;
    let cancelled = false;
    fetch(
      `/api/schedule?plan_id=${encodeURIComponent(planId)}&future_only=1`,
      { credentials: "same-origin" }
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: string; scheduled_date: string }[]) => {
        if (!cancelled && Array.isArray(data)) {
          setFutureScheduleEntries(
            data.map((e) => ({ id: e.id, scheduled_date: e.scheduled_date })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFutureScheduleEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [planId, practicePlan]);

  const setBlocks = useCallback(
    (updater: (prev: PracticeBlock[]) => PracticeBlock[]) => {
      setPracticePlan((plan) => {
        if (!plan) return plan;
        const next = updater(plan.blocks);
        const withSlots = recalcTimeSlots(next);
        const total = withSlots.reduce((s, b) => s + b.duration, 0);
        return {
          ...plan,
          blocks: withSlots,
          total_duration_minutes: total,
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!practicePlan || practicePlan.blocks.length === 0) return;
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    autoSaveTimeoutRef.current = setTimeout(async () => {
      autoSaveTimeoutRef.current = null;
      const body = {
        practice_title: practicePlan.practice_title,
        total_duration_minutes: practicePlan.total_duration_minutes,
        blocks: practicePlan.blocks.map((b) => ({
          time_slot: b.time_slot,
          drill_name: b.drill_name,
          category: b.category,
          duration: Number(b.duration),
          notes: b.notes ?? "",
        })),
      };
      try {
        const res = await fetch(`/api/plans/${planId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(
            (data.error as string) ||
              "Failed to update plan. Changes may not be saved.",
          );
        } else {
          setError(null);
        }
      } catch {
        setError("Could not save plan. Check your connection.");
      }
    }, AUTO_SAVE_DEBOUNCE_MS);
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [practicePlan, planId]);

  const moveBlock = (index: number, direction: "up" | "down") => {
    setBlocks((prev) => {
      const i = direction === "up" ? index - 1 : index;
      if (i < 0 || i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
    if (editingIndex !== null) {
      if (editingIndex === index)
        setEditingIndex(direction === "up" ? index - 1 : index + 1);
      else if (editingIndex === index - 1 && direction === "down")
        setEditingIndex(index);
      else if (editingIndex === index + 1 && direction === "up")
        setEditingIndex(index);
    }
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditDraft(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const startEdit = (index: number) => {
    if (!practicePlan) return;
    setEditingIndex(index);
    setEditDraft({ ...practicePlan.blocks[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditDraft(null);
  };

  const saveEdit = () => {
    if (editingIndex === null || editDraft === null) return;
    setBlocks((prev) => {
      const next = [...prev];
      next[editingIndex] = { ...editDraft };
      return next;
    });
    setEditingIndex(null);
    setEditDraft(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, removed);
      return next;
    });
    if (editingIndex !== null) {
      if (editingIndex === dragIndex) setEditingIndex(dropIndex);
      else if (dragIndex < editingIndex && dropIndex >= editingIndex)
        setEditingIndex(editingIndex - 1);
      else if (dragIndex > editingIndex && dropIndex <= editingIndex)
        setEditingIndex(editingIndex + 1);
    }
  };

  const planBody = practicePlan
    ? {
        practice_title: practicePlan.practice_title,
        total_duration_minutes: practicePlan.total_duration_minutes,
        blocks: practicePlan.blocks.map((b) => ({
          time_slot: b.time_slot,
          drill_name: b.drill_name,
          category: b.category,
          duration: Number(b.duration),
          notes: b.notes ?? "",
        })),
      }
    : null;

  const handleUpdateCurrentPlan = async () => {
    if (!practicePlan || !planBody) return;
    setError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(planBody),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          [data.error, data.details].filter(Boolean).join(": ") ||
          "Failed to update plan";
        throw new Error(message);
      }
      setSaveSuccess(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update plan. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDrillFromLibrary = (drill: {
    drill_name: string;
    category: string;
    duration: number;
    notes: string;
  }) => {
    const block: PracticeBlock = {
      time_slot: "",
      drill_name: drill.drill_name,
      category: drill.category,
      duration: drill.duration,
      notes: drill.notes,
    };
    setBlocks((prev) => [...prev, block]);
  };

  const handleSaveAsNewPlan = async () => {
    if (!practicePlan || !planBody) return;
    setError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(planBody),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          [data.error, data.details].filter(Boolean).join(": ") ||
          "Failed to save plan";
        throw new Error(message);
      }
      const data = (await res.json()) as { id?: string };
      if (data?.id) {
        if (futureScheduleEntries.length > 0) {
          setPendingNewPlanId(data.id);
          setScheduleDialogOpen(true);
        } else {
          router.push(`/planner/${data.id}`);
        }
        return;
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save plan. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleChoice = async (updateToNewPlan: boolean) => {
    const newId = pendingNewPlanId;
    setScheduleDialogOpen(false);
    setPendingNewPlanId(null);
    if (!newId) return;
    if (updateToNewPlan) {
      try {
        await fetch("/api/schedule/move-to-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            from_plan_id: planId,
            to_plan_id: newId,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    router.push(`/planner/${newId}`);
  };

  const backLinks = (
    <div className="flex flex-wrap items-center gap-4">
      <Link
        href="/planner?tab=saved&clear=1"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to saved plans
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {backLinks}

      {isLoading && (
        <div className="p-6 border rounded-lg animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {error && !practicePlan && !isLoading && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
          <Small className="text-destructive">{error}</Small>
        </div>
      )}

      {practicePlan && !isLoading && (
        <>
          {error && (
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <Small className="text-destructive">{error}</Small>
            </div>
          )}

          <div className="p-6 border rounded-lg">
            <div className="mb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
                <H2>
                  {titleWithDuration(
                    practicePlan.practice_title,
                    practicePlan.total_duration_minutes,
                  )}
                </H2>
                {planCreatedAt && (
                  <Small className="text-muted-foreground shrink-0">
                    Created{" "}
                    {new Date(planCreatedAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </Small>
                )}
              </div>
              <P className="text-muted-foreground">
                Total Duration: {practicePlan.total_duration_minutes} minutes
              </P>
            </div>
            <div>
              <div className="space-y-4">
                {practicePlan.blocks.map((block, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`border-l-4 border-primary pl-2 pr-4 py-3 bg-muted/30 rounded-r-lg group flex items-start gap-2 transition-colors cursor-grab active:cursor-grabbing ${
                      dragOverIndex === index
                        ? "ring-2 ring-primary/50 ring-inset"
                        : ""
                    } ${
                      draggedIndex === index ? "opacity-50 cursor-grabbing" : ""
                    }`}
                  >
                    <div
                      className="mt-1 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingIndex === index && editDraft ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Drill name</Label>
                              <Input
                                value={editDraft.drill_name}
                                onChange={(e) =>
                                  setEditDraft((d) =>
                                    d
                                      ? { ...d, drill_name: e.target.value }
                                      : d,
                                  )
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Category</Label>
                              <Input
                                value={editDraft.category}
                                onChange={(e) =>
                                  setEditDraft((d) =>
                                    d ? { ...d, category: e.target.value } : d,
                                  )
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Duration (min)</Label>
                              <Input
                                type="number"
                                min={1}
                                value={editDraft.duration}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!isNaN(v) && v >= 1)
                                    setEditDraft((d) =>
                                      d ? { ...d, duration: v } : d,
                                    );
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label className="text-xs">Time slot</Label>
                              <Small className="block font-mono text-muted-foreground">
                                {editDraft.time_slot}
                              </Small>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Notes</Label>
                            <Textarea
                              value={editDraft.notes}
                              onChange={(e) =>
                                setEditDraft((d) =>
                                  d ? { ...d, notes: e.target.value } : d,
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={saveEdit}
                              className="gap-1"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              className="gap-1"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <span className="text-base font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                                  {block.time_slot}
                                </span>
                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                  {block.category}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {block.duration} min
                                </span>
                              </div>
                              <P className="font-medium">{block.drill_name}</P>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => startEdit(index)}
                                aria-label="Edit block"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => moveBlock(index, "up")}
                                disabled={index === 0}
                                aria-label="Move up"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => moveBlock(index, "down")}
                                disabled={
                                  index === practicePlan.blocks.length - 1
                                }
                                aria-label="Move down"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeBlock(index)}
                                aria-label="Remove block"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {block.notes && (
                            <Small className="text-muted-foreground mt-2 block">
                              {block.notes}
                            </Small>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddDrillOpen(true)}
                className="gap-2"
                aria-label="Add drill from library"
              >
                <Plus className="h-4 w-4" />
                Add from library
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleUpdateCurrentPlan}
                  disabled={isSaving}
                  aria-busy={isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Update"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveAsNewPlan}
                  disabled={isSaving}
                  aria-busy={isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save as new plan"}
                </Button>
              </div>
            </div>
          </div>

          <AddDrillFromLibraryDialog
            open={addDrillOpen}
            onOpenChange={setAddDrillOpen}
            onSelect={handleAddDrillFromLibrary}
          />

          <Dialog
            open={scheduleDialogOpen}
            onOpenChange={(open) => {
              if (!open && pendingNewPlanId) {
                handleScheduleChoice(false);
              } else {
                setScheduleDialogOpen(open);
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Update schedule?</DialogTitle>
                <DialogDescription>
                  This plan is scheduled on{" "}
                  {futureScheduleEntries.length === 1
                    ? new Date(
                        futureScheduleEntries[0].scheduled_date + "T12:00:00Z",
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : futureScheduleEntries.length <= 3
                      ? futureScheduleEntries
                          .map((e) =>
                            new Date(
                              e.scheduled_date + "T12:00:00Z",
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }),
                          )
                          .join(", ")
                      : `${futureScheduleEntries.length} future dates`}
                  . Would you like to update the schedule to use the new plan, or
                  keep the current plan on these dates?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => handleScheduleChoice(false)}
                >
                  Keep current plan on schedule
                </Button>
                <Button onClick={() => handleScheduleChoice(true)}>
                  Update to new plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {saveSuccess && (
            <div className="p-4 border border-green-500/50 rounded-lg bg-green-500/10">
              <Small className="text-green-700 dark:text-green-400">
                Plan updated successfully.
              </Small>
            </div>
          )}
        </>
      )}
    </div>
  );
}
