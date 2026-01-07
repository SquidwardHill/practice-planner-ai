import { H2 } from "@/components/atoms/typography";
import Image from "next/image";

interface TitleWithAccentProps {
  prefix: string;
  accent: string;
  suffix: string;
  iconSrc?: string;
  iconAlt?: string;
  iconWidth?: number;
  iconHeight?: number;
  className?: string;
}

export function TitleWithAccent({
  prefix,
  accent,
  suffix,
  iconSrc = "/logo/sparkle-trio.svg",
  iconAlt = "Sparkle",
  iconWidth = 22,
  iconHeight = 22,
  className,
}: TitleWithAccentProps) {
  return (
    <H2 className={className}>
      <span>{prefix}</span>
      <div className="text-primary-muted items-center gap-1 inline-flex px-2">
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={iconWidth}
          height={iconHeight}
          className="contrast-75 rotate-180"
        />
        <span className="text-primary-muted">{accent}</span>
      </div>
      <span>{suffix}</span>
    </H2>
  );
}

