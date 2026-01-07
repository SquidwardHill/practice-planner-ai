import { Logo } from "@/components/atoms/logo";
import { H1, Lead } from "@/components/atoms/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface HeroSectionProps {
  hasLogo?: boolean;
  title: string;
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
      <Link href={buttonHref}>
        <Button size="lg">
          {buttonText}
          {ButtonIcon && <ButtonIcon className="h-4 w-4" />}
        </Button>
      </Link>
    </div>
  );
}
