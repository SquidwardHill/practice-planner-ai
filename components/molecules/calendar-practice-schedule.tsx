"use client";

import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { H3, P, Small } from "@/components/atoms/typography";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Calendar as CalendarIcon, ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ScheduleEntry = {
  id: string;
  practice_plan_id: string;
  scheduled_date: string;
  created_at: string;
  practice_plans: {
    id: string;
    practice_title: string;
    total_duration_minutes: number;
  } | null;
};

export interface DashboardCalendarProps {
  /** Total scheduled practices count (from server), for the "Upcoming practices" card stats */
  scheduledCount?: number;
}

type PlanOption = {
  id: string;
  practice_title: string;
  total_duration_minutes: number;
};

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseScheduleDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00Z");
}

export function DashboardCalendar({
  scheduledCount = 0,
}: DashboardCalendarProps) {
  const [month, setMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const from = new Date(month.getFullYear(), month.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?from=${from}&to=${to}`, {
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn(
          "Schedule fetch failed:",
          res.status,
          (data as { error?: string; details?: string })?.error ??
            res.statusText,
          (data as { details?: string })?.details
        );
        setSchedule([]);
        return;
      }
      setSchedule(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Schedule fetch error:", e);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/plans", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
      if (data?.length && !selectedPlanId) setSelectedPlanId(data[0].id);
    } catch (e) {
      console.error(e);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    if (selectedDate && plans.length === 0) fetchPlans();
  }, [selectedDate, plans.length, fetchPlans]);

  const scheduledDates = schedule.map((s) =>
    parseScheduleDate(s.scheduled_date)
  );
  const selectedEntry = selectedDate
    ? schedule.find((e) => e.scheduled_date === toDateKey(selectedDate))
    : undefined;

  const handleSchedulePlan = async () => {
    if (!selectedDate || !selectedPlanId) return;
    setScheduling(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          practice_plan_id: selectedPlanId,
          scheduled_date: toDateKey(selectedDate),
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      await fetchSchedule();
    } catch (e) {
      console.error(e);
    } finally {
      setScheduling(false);
    }
  };

  const handleRemoveFromSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to remove");
      await fetchSchedule();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="shrink-0">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{ scheduled: scheduledDates }}
          modifiersClassNames={{
            scheduled:
              "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-primary",
          }}
          className="rounded-md border flex w-full [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
        />
      </div>

      <Card className="flex-1 min-w-0 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold tracking-tight">
            Upcoming practices
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col pt-0">
          <div className="border-t border-border pt-4 space-y-4">
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {loading && schedule.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Small>Loading schedule…</Small>
              </div>
            ) : selectedDate ? (
              selectedEntry ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    {selectedEntry.practice_plans && (
                      <>
                        <p className="font-medium">
                          {selectedEntry.practice_plans.practice_title}
                        </p>
                        <Small className="text-muted-foreground">
                          {selectedEntry.practice_plans.total_duration_minutes}{" "}
                          min
                        </Small>
                        <div className="mt-2 flex items-center gap-2">
                          <Link
                            href="/planner"
                            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View plan
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => handleRemoveFromSchedule(selectedEntry.id)}
                  >
                    Remove from schedule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <P className="text-muted-foreground text-sm">
                    No practice scheduled for this date. Pick a plan to attach.
                  </P>
                  <Select
                    value={selectedPlanId}
                    onValueChange={setSelectedPlanId}
                    disabled={plans.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a plan…" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.practice_title} ({p.total_duration_minutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {plans.length === 0 && !loading && (
                    <Small className="text-muted-foreground">
                      No saved plans yet. Create one in the{" "}
                      <Link
                        href="/planner"
                        className="text-primary hover:underline"
                      >
                        planner
                      </Link>
                      .
                    </Small>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSchedulePlan}
                    disabled={!selectedPlanId || scheduling}
                  >
                    {scheduling ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Scheduling…
                      </>
                    ) : (
                      "Schedule this plan"
                    )}
                  </Button>
                </div>
              )
            ) : (
              <P className="text-muted-foreground text-sm">
                Pick a date on the calendar to get started.
              </P>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
