import { CheckCircle2 } from "lucide-react";
import { type Benefit, type SimpleBenefit } from "@/lib/data/benefits";
import { H3, P } from "@/components/atoms/typography";

interface BenefitsSectionProps {
  benefits: Benefit[] | SimpleBenefit[];
  variant?: "welcome" | "public";
  className?: string;
}

export function BenefitsSection({
  benefits,
  variant = "public",
  className = "",
}: BenefitsSectionProps) {
  if (variant === "welcome") {
    const welcomeBenefits = benefits as Benefit[];
    return (
      <div className={`space-y-4 ${className}`}>
        {welcomeBenefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div key={benefit.title} className="flex gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <P className="font-medium">{benefit.title}</P>
                <P className="text-muted-foreground">{benefit.description}</P>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Public variant
  const publicBenefits = benefits as SimpleBenefit[];
  return (
    <div className={`grid gap-6 md:grid-cols-2 max-w-4xl mx-auto ${className}`}>
      {publicBenefits.map((benefit) => (
        <div key={benefit.title} className="flex gap-3">
          <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <H3 className="mb-1 text-card-foreground">{benefit.title}</H3>
            <P className="text-muted-foreground">{benefit.description}</P>
          </div>
        </div>
      ))}
    </div>
  );
}
