"use client";

import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

export function DashboardCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  // TODO -> dynamically load user schedule data, display details of selected date (practice schedule)
  // TODO optional, hover pointer details && link to schedule item from date
  const selected = date
    ? `${date.toLocaleDateString()} -> Free Throw practice`
    : "Select a date to see what's scheduled.";

  return (
    <div className="flex flex-row gap-12">
      <div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border flex w-full [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
        />
      </div>
      <div>{selected}</div>
    </div>
  );
}
