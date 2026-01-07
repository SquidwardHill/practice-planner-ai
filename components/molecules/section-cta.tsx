import { H2, P } from "@/components/atoms/typography";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

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
    <div className="text-center bg-linear-to-b from-background via-primary/5 to-primary/40 rounded-2xl pt-4 mt-42">
      <div className="flex flex-col items-center justify-center bg-linear-to-b from-background via-background/65 to-primary/45 rounded-2xl pb-12">
        <H2 className="mb-2 max-w-3xl mx-auto">{title}</H2>
        <P className="text-muted-foreground mb-8 text-xl max-w-3xl mx-auto">
          {description}
        </P>
        <Link href={buttonHref} className="pb-6">
          <Button variant="light" size="lg">
            {buttonText}
            <ButtonIcon className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
