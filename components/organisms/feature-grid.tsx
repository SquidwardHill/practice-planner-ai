import { LucideIcon } from "lucide-react";
import { FeatureCard } from "../molecules/feature-card";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

interface FeatureGridProps {
  features: Feature[];
  hasAccess?: boolean;
}

export function FeatureGrid({
  features,
  hasAccess = true,
}: FeatureGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          href={feature.href}
          hasAccess={hasAccess}
        />
      ))}
    </div>
  );
}
