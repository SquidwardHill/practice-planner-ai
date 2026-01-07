import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { P } from "@/components/atoms/typography";
import Image from "next/image";
import { PRODUCT_NAME } from "@/lib/config/branding";

const SHOPIFY_SUBSCRIPTION_URL =
  process.env.NEXT_PUBLIC_SHOPIFY_SUBSCRIPTION_URL || "https://hoopsking.com";

interface SubscriptionRequiredProps {
  message?: string;
  additionalMessage?: string;
}

export function SubscriptionRequired({
  message = "Subscribe to unlock this feature",
  additionalMessage,
}: SubscriptionRequiredProps) {
  return (
    <div className="text-center py-16 border rounded-lg p-8 max-w-6xl mx-auto">
      <div className="flex flex-col justify-center items-center gap-2">
        <Image
          src="/logo/planner-ai-logo-icon-blue.svg"
          alt={PRODUCT_NAME}
          width={32}
          height={32}
        />
        <P className="text-muted-foreground mb-2">{message}</P>
        {additionalMessage && (
          <P className="text-muted-foreground text-sm mb-2">
            {additionalMessage}
          </P>
        )}
        <a
          href={SHOPIFY_SUBSCRIPTION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="default">
            View Plans
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}
