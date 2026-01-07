import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  hasAccess?: boolean;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  hasAccess = true,
}: FeatureCardProps) {
  const cardContent = (
    <Card className={cn(
      "flex flex-col relative group transition-all cursor-pointer",
      hasAccess 
        ? "hover:border-primary/50 hover:shadow-md" 
        : "opacity-60 cursor-not-allowed"
    )}>
      <CardHeader className="flex-1">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <div className="flex items-center justify-end">
          {hasAccess ? (
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (hasAccess) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}