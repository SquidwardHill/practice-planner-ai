"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  Sparkle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PRACTICE_PLAN_STORAGE_KEY } from "@/lib/storage-keys";

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

/** Update the duration number in the plan title to match current total (e.g. "30-Minute ..." → "45-Minute ..."). */
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

const STORAGE_VERSION = 1;
const AUTO_SAVE_DEBOUNCE_MS = 1800;

interface StoredPlanPayload {
  version: number;
  user_id: string;
  plan: PracticePlan;
  saved_plan_id?: string | null;
}

function parseStoredPlan(
  raw: string,
  currentUserId: string | null,
): { plan: PracticePlan; savedPlanId: string | null } | null {
  if (!currentUserId) return null;
  try {
    const data = JSON.parse(raw) as StoredPlanPayload | PracticePlan;
    if (
      data &&
      typeof data === "object" &&
      "user_id" in data &&
      "plan" in data
    ) {
      const payload = data as StoredPlanPayload;
      if (payload.user_id !== currentUserId) return null;
      const plan = payload.plan;
      if (
        plan &&
        typeof plan.practice_title === "string" &&
        typeof plan.total_duration_minutes === "number" &&
        Array.isArray(plan.blocks) &&
        plan.blocks.length > 0
      ) {
        return {
          plan,
          savedPlanId: payload.saved_plan_id ?? null,
        };
      }
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

interface PlannerFormProps {
  /** When true, clear localStorage draft and do not restore (e.g. when returning from plan editor) */
  clearDraft?: boolean;
}

export function PlannerForm({ clearDraft = false }: PlannerFormProps) {
  const router = useRouter();
  const [practicePlan, setPracticePlan] = useState<PracticePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [input, setInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<PracticeBlock | null>(null);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planContainerRef = useRef<HTMLDivElement | null>(null);
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

  // Resolve current user id for storage scoping
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  // When returning from plan editor, clear cached draft so no plan shows
  useEffect(() => {
    if (!clearDraft || typeof window === "undefined") return;
    localStorage.removeItem(PRACTICE_PLAN_STORAGE_KEY);
    setPracticePlan(null);
    setSavedPlanId(null);
    setPlanCreatedAt(null);
  }, [clearDraft]);

  // Restore draft from localStorage only when it belongs to the current user (after user is resolved) and we're not clearing
  useEffect(() => {
    if (typeof window === "undefined" || userId === undefined || clearDraft)
      return;
    const stored = localStorage.getItem(PRACTICE_PLAN_STORAGE_KEY);
    if (!stored) return;
    const parsed = parseStoredPlan(stored, userId);
    if (parsed) {
      setPracticePlan(parsed.plan);
      setSavedPlanId(parsed.savedPlanId);
    } else {
      localStorage.removeItem(PRACTICE_PLAN_STORAGE_KEY);
    }
  }, [userId, clearDraft]);

  // Persist plan and savedPlanId to localStorage
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !practicePlan ||
      typeof userId !== "string"
    )
      return;
    const payload: StoredPlanPayload = {
      version: STORAGE_VERSION,
      user_id: userId,
      plan: practicePlan,
      saved_plan_id: savedPlanId ?? undefined,
    };
    localStorage.setItem(PRACTICE_PLAN_STORAGE_KEY, JSON.stringify(payload));
  }, [practicePlan, userId, savedPlanId]);

  // Auto-save to database when plan changes (debounced)
  useEffect(() => {
    if (
      !practicePlan ||
      practicePlan.blocks.length === 0 ||
      typeof userId !== "string"
    ) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      return;
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
        if (savedPlanId) {
          const res = await fetch(`/api/plans/${savedPlanId}`, {
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
        } else {
          const res = await fetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(
              (data.error as string) || "Failed to save plan. Try again.",
            );
          } else {
            const data = (await res.json()) as {
              id?: string;
              created_at?: string;
            };
            if (data?.id) setSavedPlanId(data.id);
            if (data?.created_at) setPlanCreatedAt(data.created_at);
            setError(null);
          }
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
  }, [practicePlan, userId, savedPlanId]);

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

  const handleFinalizeSave = async () => {
    if (!practicePlan) return;
    setError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      if (savedPlanId) {
        // Already saved via auto-save; just clear and refresh
        localStorage.removeItem(PRACTICE_PLAN_STORAGE_KEY);
        setPracticePlan(null);
        setSavedPlanId(null);
        setPlanCreatedAt(null);
        setEditingIndex(null);
        setEditDraft(null);
        setSaveSuccess(true);
        router.refresh();
        return;
      }
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
      localStorage.removeItem(PRACTICE_PLAN_STORAGE_KEY);
      setPracticePlan(null);
      setSavedPlanId(null);
      setPlanCreatedAt(null);
      setEditingIndex(null);
      setEditDraft(null);
      setSaveSuccess(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save plan. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);
    setEditingIndex(null);
    setEditDraft(null);
    setIsLoading(true);

    const hadSavedPlanId = savedPlanId != null;
    const existingPlanForApi =
      practicePlan && practicePlan.blocks?.length > 0
        ? {
            practice_title: practicePlan.practice_title,
            total_duration_minutes: practicePlan.total_duration_minutes,
            blocks: practicePlan.blocks.map((b) => ({
              time_slot: b.time_slot,
              drill_name: b.drill_name,
              category: b.category,
              duration: b.duration,
              notes: b.notes ?? "",
            })),
          }
        : undefined;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          ...(existingPlanForApi && { existingPlan: existingPlanForApi }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to generate practice plan";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.details || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let jsonText = "";

      if (!reader) {
        throw new Error("No response body");
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            jsonText += decoder.decode(value, { stream: true });
          }
        }

        jsonText += decoder.decode();

        if (!jsonText.trim()) {
          throw new Error(
            "Empty response from server - the stream completed but no data was received",
          );
        }

        let data: PracticePlan;
        try {
          data = JSON.parse(jsonText) as PracticePlan;
        } catch (parseError) {
          console.error(
            "JSON parse error:",
            parseError,
            "Received text:",
            jsonText,
          );
          throw new Error(
            "The response was incomplete. This may happen if the generation takes too long. Please try again with a shorter practice duration or simpler request.",
          );
        }

        if (
          !data.practice_title ||
          !data.blocks ||
          !Array.isArray(data.blocks)
        ) {
          throw new Error("Invalid response format from server");
        }

        const blocksWithSlots = recalcTimeSlots(data.blocks);
        const total = blocksWithSlots.reduce((s, b) => s + b.duration, 0);
        if (!hadSavedPlanId) setSavedPlanId(null);
        setPracticePlan({
          ...data,
          blocks: blocksWithSlots,
          total_duration_minutes: total,
        });
      } catch (streamError) {
        if (streamError instanceof Error) {
          throw streamError;
        }
        throw new Error("Failed to read stream response");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-6xl mx-auto">
            <div className="space-y-6">
              <textarea
                id="prompt"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Example: Create a 90-minute varsity basketball practice focusing on transition defense and conditioning."
                className="flex min-h-[100px] w-full glow-primary rounded-md border border-input bg-transparent p-4 text-base shadow-xs placeholder:text-muted-foreground/70 dark:bg-input/30 transition-[color,box-shadow] focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none text-center"
                rows={4}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="default"
              disabled={isLoading || !input.trim()}
              aria-busy={isLoading}
              className="mt-2"
            >
              <Sparkle className="size-4" />
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
          <Small className="text-destructive">{error}</Small>
        </div>
      )}

      {isLoading && (
        <div className="p-6 border rounded-lg">
          <div className="space-y-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="border-l-4 border-primary/20 pl-4 py-3 bg-muted/30 rounded-r-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="h-5 w-24 bg-muted rounded" />
                        <span className="h-4 w-16 bg-muted rounded" />
                        <span className="h-4 w-10 bg-muted rounded" />
                      </div>
                      <div className="h-5 w-40 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {practicePlan && !isLoading && (
        <div
          ref={planContainerRef}
          className="p-6 border rounded-lg scroll-mt-4"
        >
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
                                  d ? { ...d, drill_name: e.target.value } : d,
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
          <div className="mt-6 pt-4 border-t flex justify-end">
            <Button
              type="button"
              onClick={handleFinalizeSave}
              disabled={isSaving}
              aria-busy={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Finalize & Save"}
            </Button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 border border-green-500/50 rounded-lg bg-green-500/10">
          <Small className="text-green-700 dark:text-green-400">
            Plan saved successfully. You can create a new plan or view saved
            plans later.
          </Small>
        </div>
      )}
    </div>
  );
}
