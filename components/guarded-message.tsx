import { P } from "@/components/typography";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

export function GuardedMessage() {
  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <Image
          src="/logo/planner-ai-logo-icon-blue.svg"
          alt="Practice Planner AI"
          width={32}
          height={32}
        />
      </div>
      <P className="text-muted-foreground mb-2">
        A subscription to Practice Planner AI is required to use this feature.
      </P>
      {/* TODO: Update ENV with correct shopify product URL */}
      <a
        className="flex items-center gap-2 justify-center text-primary underline font-bold tracking-wide"
        target="_blank"
        href={process.env.SHOPIFY_SUBSCRIPTION_URL || "/auth/login"}
      >
        Purchase a subscription
        <ExternalLink className="size-4" />
      </a>
    </div>
  );
}
