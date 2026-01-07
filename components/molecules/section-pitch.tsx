import { P } from "@/components/atoms/typography";
import { type ReactNode } from "react";

interface SectionPitchProps {
  title: ReactNode;
  description: string;
}

export function SectionPitch({ title, description }: SectionPitchProps) {
  return (
    <div>
      <div className="my-12 glow-primary-muted rounded-3xl">
        <div className="max-w-6xl mx-auto rounded-2xl p-px bg-linear-to-b from-primary-muted/70 via-primary-muted/40 to-background/50">
          <div className="rounded-[calc(1.2rem-1px)] p-10 bg-background text-center">
            <div className="max-w-3xl mx-auto pt-6">{title}</div>
            <P className="text-muted-foreground text-xl pt-4 max-w-3xl mx-auto pb-2">
              {description}
            </P>
          </div>
        </div>
      </div>
    </div>
  );
}
