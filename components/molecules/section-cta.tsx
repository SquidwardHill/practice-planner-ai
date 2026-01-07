import { H2, P } from "@/components/atoms/typography";
import { CtaButton } from "@/components/atoms/cta-button";
import { ArrowRight, type LucideIcon } from "lucide-react";
import Image from "next/image";

interface SectionCtaProps {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  buttonIcon?: LucideIcon;
}

export function SectionCta({
  title,
  description,
  buttonText,
  buttonHref,
  buttonIcon: ButtonIcon = ArrowRight,
}: SectionCtaProps) {
  return (
    <div className="text-center bg-linear-to-b from-background via-primary/5 to-primary/40 rounded-2xl pt-4 mt-30">
      <div className="flex flex-col items-center justify-center bg-linear-to-b from-background via-background/65 to-primary/45 rounded-2xl pb-12">
        <H2 className="mb-4 max-w-3xl mx-auto">{title}</H2>
        <P className="text-muted-foreground mb-8 text-xl max-w-3xl mx-auto">
          {description}
        </P>
        <CtaButton
          href={buttonHref}
          text={buttonText}
          icon={ButtonIcon}
          variant="light"
          linkClassName="pb-6"
        />
      </div>
    </div>
  );
}
