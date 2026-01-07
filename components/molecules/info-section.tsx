import { type ReactNode } from "react";
import { H3, P } from "@/components/atoms/typography";
import { cn } from "@/lib/utils";

interface InfoSectionProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  showHeaderBorder?: boolean;
}

export function InfoSection({
  title,
  description,
  children,
  className,
  headerClassName,
  showHeaderBorder = true,
}: InfoSectionProps) {
  return (
    <div className={cn("p-6 border rounded-lg", className)}>
      <div
        className={cn(
          "mb-4",
          showHeaderBorder && "border-b pb-4",
          headerClassName
        )}
      >
        <H3 className="mb-1">{title}</H3>
        {description && (
          <>
            {typeof description === "string" ? (
              <P className="text-muted-foreground">{description}</P>
            ) : (
              <div className="text-muted-foreground ">{description}</div>
            )}
          </>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
