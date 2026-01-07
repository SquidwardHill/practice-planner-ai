import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({
  className,
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "full";
}) {
  return (
    <>
      <Image
        src={
          variant === "icon"
            ? "/logo/planner-ai-logo-icon-blue.svg"
            : "/logo/planner-ai-logo-light-mode.svg"
        }
        alt="Practice Planner AI"
        width={218}
        height={100}
        className={cn(
          "h-9 w-auto object-contain dark:hidden mb-4 mx-auto block",
          className
        )}
      />
      <Image
        src={
          variant === "icon"
            ? "/logo/planner-ai-logo-icon-blue.svg"
            : "/logo/planner-ai-logo-dark-mode.svg"
        }
        alt="Practice Planner AI"
        width={218}
        height={100}
        className={cn("h-9 w-auto object-contain hidden dark:block", className)}
      />
    </>
  );
}
