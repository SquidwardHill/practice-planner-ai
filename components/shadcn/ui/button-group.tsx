import * as React from "react";
import { cn } from "@/lib/utils";

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    data-slot="button-group"
    className={cn(
      "flex w-fit items-stretch",
      "has-[>_[data-slot=button-group]]:gap-2",
      "has-[select[aria-hidden=true]:last-child]:[&>_[data-slot=select-trigger]:last-of-type]:rounded-r-lg",
      "[&>*]:focus-visible:z-10",
      "[&>*]:focus-visible:relative",
      "[&>_[data-slot=select-trigger]:not([class*='w-'])]:w-fit",
      "[&>input]:flex-1",
      "[&>_[data-slot]:not(:has(~[data-slot]))]:rounded-r-lg!",
      "[&>*:not(:first-child)]:rounded-l-none",
      "[&>*:not(:first-child)]:border-l-0",
      "[&>*:not(:last-child)]:rounded-r-none",
      className
    )}
    {...props}
  />
));
ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup };
