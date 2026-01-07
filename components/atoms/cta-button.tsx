import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

interface CtaButtonProps {
  href: string;
  text: string;
  icon?: LucideIcon;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  linkClassName?: string;
}

export function CtaButton({
  href,
  text,
  icon: Icon = ArrowRight,
  variant = "default",
  size = "lg",
  className,
  linkClassName,
}: CtaButtonProps) {
  return (
    <Link href={href} className={linkClassName}>
      <Button variant={variant} size={size} className={className}>
        {text}
        <Icon className="h-4 w-4" />
      </Button>
    </Link>
  );
}

