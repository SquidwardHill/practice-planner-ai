import { P } from "@/components/atoms/typography";
import { CtaButton } from "@/components/atoms/cta-button";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

interface SectionPitchProps {
  title: ReactNode;
  description: string;
  ctaLink?: string;
  ctaText?: string;
  ctaButtonVariant?: VariantProps<typeof buttonVariants>["variant"];
  ctaIcon?: LucideIcon;
  secondaryCtaLink?: string;
  secondaryCtaText?: string;
}

export function SectionPitch({
  title,
  description,
  ctaLink,
  ctaText = "Get started",
  ctaButtonVariant = "default",
  ctaIcon: CtaIcon = ArrowRight,
  secondaryCtaLink,
  secondaryCtaText,
}: SectionPitchProps) {
  return (
    <div>
      <div className="mb-8 glow-primary-muted rounded-3xl">
        <div className="max-w-6xl mx-auto rounded-2xl p-px bg-linear-to-b from-primary-muted/70 via-primary-muted/40 to-background/50">
          <div className="rounded-[calc(1.2rem-1px)] p-10 bg-background text-center">
            <div className="max-w-3xl mx-auto pt-6">{title}</div>
            <P className="text-muted-foreground text-xl pt-4 max-w-3xl mx-auto pb-6">
              {description}
            </P>
            {(ctaLink || secondaryCtaLink) && (
              <div className="flex items-center justify-center gap-3 pb-4">
                {ctaLink && (
                  <CtaButton
                    href={ctaLink}
                    text={ctaText}
                    icon={CtaIcon}
                    variant={ctaButtonVariant}
                  />
                )}
                {secondaryCtaLink && secondaryCtaText && (
                  <CtaButton
                    href={secondaryCtaLink}
                    text={secondaryCtaText}
                    variant="outline"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
