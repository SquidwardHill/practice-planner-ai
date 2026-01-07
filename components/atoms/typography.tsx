import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1
      className={cn("text-3xl font-bold tracking-tight sm:text-4xl", className)}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2
      className={cn(
        "text-2xl font-semibold tracking-tight sm:text-3xl",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3
      className={cn(
        "text-xl font-semibold tracking-tight sm:text-2xl",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn("text-lg font-semibold tracking-tight", className)}>
      {children}
    </h4>
  );
}

export function P({ children, className }: TypographyProps) {
  return <p className={cn("text-base leading-7", className)}>{children}</p>;
}

export function Lead({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-xl text-muted-foreground", className)}>{children}</p>
  );
}

export function Small({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}

export function Muted({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}
