import { type FeatureCard } from "@/lib/data/features";
import { H3, P } from "@/components/typography";

interface FeatureCardsSectionProps {
  features: FeatureCard[];
  className?: string;
}

export function FeatureCardsSection({
  features,
  className = "",
}: FeatureCardsSectionProps) {
  return (
    <div className={`grid gap-6 md:grid-cols-3 ${className}`}>
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <div key={feature.title} className="p-4 border rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <H3 className="mb-2">{feature.title}</H3>
            <P className="text-muted-foreground">{feature.description}</P>
          </div>
        );
      })}
    </div>
  );
}
