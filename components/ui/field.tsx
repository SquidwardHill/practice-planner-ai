import * as React from "react";
import { cn } from "@/lib/utils";

const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
    invalid?: boolean;
  }
>(({ className, orientation = "vertical", invalid, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    data-slot="field"
    data-orientation={orientation}
    data-invalid={invalid}
    className={cn(
      "group/field flex w-full gap-2",
      orientation === "horizontal"
        ? "flex-row items-center"
        : "flex-col",
      "data-[invalid=true]:text-destructive",
      "has-[>_[data-slot=field-label]]:flex-auto",
      "has-[>_[data-slot=field-content]]:items-start",
      "has-[>_[data-slot=field-content]]:[&>_[role=checkbox],[role=radio]]:mt-px",
      className
    )}
    {...props}
  />
));
Field.displayName = "Field";

const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field-content"
    className={cn(
      "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
      className
    )}
    {...props}
  />
));
FieldContent.displayName = "FieldContent";

const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    data-slot="field-label"
    className={cn(
      "peer/field-label group/field-label flex w-fit items-center gap-2 text-sm font-medium leading-snug select-none",
      "group-data-[disabled=true]/field:opacity-50",
      "group-data-[disabled=true]:pointer-events-none",
      "group-data-[disabled=true]:opacity-50",
      "peer-disabled:cursor-not-allowed",
      "peer-disabled:opacity-50",
      "has-data-checked:bg-primary/5",
      "has-data-checked:border-primary",
      "dark:has-data-checked:bg-primary/10",
      "has-[>_[data-slot=field]]:rounded-lg",
      "has-[>_[data-slot=field]]:border",
      "[&>*]:data-[slot=field]:p-2.5",
      "has-[>_[data-slot=field]]:w-full",
      "has-[>_[data-slot=field]]:flex-col",
      className
    )}
    {...props}
  />
));
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="field-description"
    className={cn(
      "text-muted-foreground text-left text-sm leading-normal font-normal",
      "group-has-[[data-orientation=horizontal]]/field:text-balance",
      "[[data-variant=legend]+&]:-mt-1.5",
      "last:mt-0",
      "nth-last-2:-mt-1",
      "[&>a:hover]:text-primary",
      "[&>a]:underline",
      "[&>a]:underline-offset-4",
      className
    )}
    {...props}
  />
));
FieldDescription.displayName = "FieldDescription";

export { Field, FieldContent, FieldLabel, FieldDescription };
