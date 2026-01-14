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
import { H3, P } from "@/components/atoms/typography";
import Image from "next/image";

export function DashboardCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  // TODO -> dynamically load user schedule data, display details of selected date (practice schedule)
  // TODO optional, hover pointer details && link to schedule item from date
  const selected = date
    ? `${date.toLocaleDateString()}`
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
      <div>
        <H3 className="mb-6">Upcoming Practices</H3>
        <div className="flex flex-row items-center gap-2">
          <span className="text-mono font-medium text-lg text-primary-muted">
            {selected}
          </span>
          <Image
            src="/logo/sparkle-trio.svg"
            alt="Sparkle"
            width={18}
            height={18}
          />
          <span className="text-mono font-medium text-lg">
            Free Throw drills [static data]
          </span>
        </div>
      </div>
    </div>
  );
}
