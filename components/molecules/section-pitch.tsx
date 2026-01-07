import { P } from "@/components/atoms/typography";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

interface SectionPitchProps {
  title: ReactNode;
  description: string;
  ctaLink?: string;
  ctaText?: string;
}

export function SectionPitch({
  title,
  description,
  ctaLink,
  ctaText = "Get started",
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
            {ctaLink && (
              <Link href={ctaLink} className="block text-center pb-4">
                <Button variant="outline" size="lg">
                  {ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
