import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { History, Clock, LucideIcon } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Your recently created practice plans and drills
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {activity.date}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{emptyStateTitle}</p>
            <p className="text-xs mt-1">{emptyStateDescription}</p>
          </div>
        )}
        <div className="pt-4 border-t mt-4">
          <Link href={viewAllHref}>
            <Button variant="outline" className="w-full">
              {viewAllText}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

