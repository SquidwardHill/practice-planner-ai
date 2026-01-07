import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History, Clock, LucideIcon } from "lucide-react";
import { H3, P, Small } from "@/components/atoms/typography";

export interface ActivityItem {
  type: string;
  title: string;
  date: string;
  icon: LucideIcon;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  viewAllHref?: string;
  viewAllText?: string;
}

export function RecentActivity({
  activities = [],
  emptyStateTitle = "No recent activity",
  emptyStateDescription = "Start creating drills and practice plans to see them here",
  viewAllHref = "/library",
  viewAllText = "View All Activity",
}: RecentActivityProps) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border shadow-sm py-6">
      <div className="px-6">
        <H3 className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity
        </H3>
        <Small className="text-muted-foreground mt-1">
          Your recently created practice plans and drills
        </Small>
      </div>
      {activities.length > 0 ? (
        <div className="space-y-2 px-6">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <P>{activity.title}</P>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <Small className="text-muted-foreground">
                      {activity.date}
                    </Small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground px-6">
          <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <P>{emptyStateTitle}</P>
          <Small className="mt-1">{emptyStateDescription}</Small>
        </div>
      )}
      <div className="px-6">
        <Link href={viewAllHref}>
          <Button variant="outline" size="default" className="w-full">
            {viewAllText}
          </Button>
        </Link>
      </div>
    </div>
  );
}
