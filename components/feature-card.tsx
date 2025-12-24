import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  hasAccess?: boolean;
  buttonText?: string;
  disabledButtonText?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  hasAccess = true,
  buttonText = "Get Started",
  disabledButtonText = "Unlock Access",
}: FeatureCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        {hasAccess ? (
          <Link href={href}>
            <Button variant="outline" className="w-full">
              {buttonText}
            </Button>
          </Link>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            {disabledButtonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

