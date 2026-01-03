import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type FeatureCard } from "@/lib/data/features";

interface FeatureCardsSectionProps {
  features: FeatureCard[];
  className?: string;
}

export function FeatureCardsSection({
  features,
  className = "",
}: FeatureCardsSectionProps) {
  return (
    <div className={`grid gap-8 md:grid-cols-3 ${className}`}>
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card key={feature.title}>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}

