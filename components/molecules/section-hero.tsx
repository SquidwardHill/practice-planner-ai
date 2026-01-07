import { Logo } from "@/components/atoms/logo";
import { H1, Lead } from "@/components/atoms/typography";
import { CtaButton } from "@/components/atoms/cta-button";
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface HeroSectionProps {
  hasLogo?: boolean;
  title: string | ReactNode;
  description: string;
  buttonText: string;
  buttonHref: string;
  buttonIcon?: LucideIcon;
}

export function HeroSection({
  hasLogo = true,
  title,
  description,
  buttonText,
  buttonHref,
  buttonIcon: ButtonIcon,
}: HeroSectionProps) {
  return (
    <div className="text-center border border-primary/90 rounded-2xl px-10 pt-10 pb-14 bg-background glow-primary w-full">
      {hasLogo && <Logo className="mb-6 mx-auto w-11 h-auto" />}
      <H1 className="max-w-3xl mx-auto">{title}</H1>
      <Lead className="max-w-3xl mx-auto mb-8 mt-4 text-xl">{description}</Lead>
      <CtaButton
        href={buttonHref}
        text={buttonText}
        icon={ButtonIcon}
      />
    </div>
  );
}
