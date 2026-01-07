import { type ReactNode } from "react";
import { P, Small } from "@/components/atoms/typography";
import { cn } from "@/lib/utils";

interface InfoFieldProps {
  label: string;
  value: ReactNode;
  labelClassName?: string;
  valueClassName?: string;
  className?: string;
}

export function InfoField({
  label,
  value,
  labelClassName,
  valueClassName,
  className,
}: InfoFieldProps) {
  return (
    <div className={cn("", className)}>
      <label
        className={cn(
          "text-sm font-medium text-primary-muted",
          labelClassName
        )}
      >
        {label}
      </label>
      <div className={cn("mt-1", valueClassName)}>
        {typeof value === "string" ? <P>{value || "Not set"}</P> : value}
      </div>
    </div>
  );
}

