"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { H2 } from "@/components/atoms/typography";

export interface SummaryStat {
  value: string | number;
  label: string;
}

export interface SummaryCardProps {
  title: string;
  description: string;
  stats: SummaryStat[];
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}

function SummaryCard({
  title,
  description,
  stats,
  ctaLabel,
  ctaHref,
  className,
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col border-border bg-card text-card-foreground",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle>
          <H2>{title}</H2>
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-border pt-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-baseline gap-x-4">
              {i > 0 && (
                <span
                  className="hidden sm:inline h-8 w-px shrink-0 bg-border"
                  aria-hidden
                />
              )}
              <div>
                <p className="text-2xl font-bold tracking-tight text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Link href={ctaHref}>
            <Button variant="outline" size="lg" className="gap-1.5">
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export interface DashboardSummaryCardsProps {
  /** Practice plans count */
  plansCount: number;
  /** Scheduled practices count (on calendar) */
  scheduledCount: number;
  /** Total drills in library */
  drillCount: number;
  /** Total categories (for Drill Library card) */
  categoriesCount?: number;
  /** AI/product name for descriptions */
  aiName?: string;
  className?: string;
}

export function DashboardSummaryCards({
  plansCount,
  scheduledCount,
  drillCount,
  categoriesCount = 0,
  aiName = "Planner AI",
  className,
}: DashboardSummaryCardsProps) {
  const plannerStats: SummaryStat[] = [
    { value: plansCount, label: "Practice Plans" },
    { value: scheduledCount, label: "Scheduled" },
  ];

  const libraryStats: SummaryStat[] = [
    { value: drillCount, label: "Total Drills" },
    { value: categoriesCount, label: "Categories (total)" },
  ];

  return (
    <div className={cn("grid gap-6 sm:grid-cols-1 lg:grid-cols-2", className)}>
      <SummaryCard
        title="Planner"
        description={`${aiName} helps you to quickly generate practice plans by pulling from your drill library.`}
        stats={plannerStats}
        ctaLabel="Go to planner"
        ctaHref="/planner"
      />
      <SummaryCard
        title="Drill Library"
        description={`Import, edit, and create drills that ${aiName} can pull from to generate practice plans.`}
        stats={libraryStats}
        ctaLabel="Go to library"
        ctaHref="/library"
      />
    </div>
  );
}
