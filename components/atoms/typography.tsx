import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn("text-3xl font-bold tracking-tight sm:text-4xl", className)}
      {...props}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        "text-2xl font-semibold tracking-tight sm:text-3xl",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        "text-xl font-semibold tracking-tight sm:text-2xl",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className, ...props }: TypographyProps) {
  return (
    <h4
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    >
      {children}
    </h4>
  );
}

export function P({ children, className, ...props }: TypographyProps) {
  return (
    <p className={cn("text-base leading-7", className)} {...props}>
      {children}
    </p>
  );
}

export function Lead({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn("text-xl text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Small({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Muted({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}
