import { type FeatureCard } from "@/lib/data/features";
import { H3, P } from "@/components/atoms/typography";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardsSectionProps {
  features: (FeatureCard & { href?: string; hasAccess?: boolean })[];
  className?: string;
  hasAccess?: boolean;
}

export function FeatureCardsSection({
  features,
  className = "",
  hasAccess = true,
}: FeatureCardsSectionProps) {
  return (
    <div className={`grid gap-6 md:grid-cols-3 items-stretch ${className}`}>
      {features.map((feature) => {
        const Icon = feature.icon;
        const isClickable =
          feature.href && hasAccess && (feature.hasAccess ?? true);

        const cardContent = (
          <div
            className={cn(
              "p-4 border rounded-lg flex flex-col relative group transition-all h-full",
              isClickable
                ? "cursor-pointer hover:border-primary/50 hover:shadow-md"
                : "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <H3 className="mb-2">{feature.title}</H3>
            <P className="text-muted-foreground flex-1">
              {feature.description}
            </P>
            {feature.href && (
              <div className="flex items-center justify-end mt-4">
                {isClickable ? (
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        );

        if (isClickable && feature.href) {
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="block h-full"
            >
              {cardContent}
            </Link>
          );
        }

        return (
          <div key={feature.title} className="h-full">
            {cardContent}
          </div>
        );
      })}
    </div>
  );
}
