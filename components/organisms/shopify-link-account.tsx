"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { P, Small } from "@/components/atoms/typography";
import { Link2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ShopifyLinkAccountProps {
  /**
   * The user's email address (will be used as default if no email is provided)
   */
  userEmail?: string | null;
  /**
   * Whether to show the email input field (useful if user might have different Shopify email)
   */
  showEmailInput?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Callback when account is successfully linked
   */
  onSuccess?: () => void;
  /**
   * Variant of the button
   */
  buttonVariant?: "default" | "outline";
  /**
   * Size of the button
   */
  buttonSize?: "default" | "sm" | "lg";
}

export function ShopifyLinkAccount({
  userEmail,
  showEmailInput = false,
  className,
  onSuccess,
  buttonVariant = "default",
  buttonSize = "default",
}: ShopifyLinkAccountProps) {
  const [email, setEmail] = useState(userEmail || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleLinkAccount = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("You must be logged in to link your account");
      }

      const emailToUse = email.trim() || userEmail;
      if (!emailToUse) {
        throw new Error("Email is required");
      }

      const response = await fetch("/api/shopify/link-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to link account");
      }

      if (data.linked) {
        setSuccess(true);
        // Dispatch refresh event for user access context
        window.dispatchEvent(new Event("user-access-refresh"));
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Default: refresh the page after a short delay
          setTimeout(() => {
            router.refresh();
          }, 1500);
        }
      } else {
        throw new Error(data.message || "Failed to link account");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20",
          className
        )}
      >
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <P className="text-sm font-medium">Account linked successfully!</P>
          <Small className="text-muted-foreground">
            Your Shopify account has been connected. Refreshing...
          </Small>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showEmailInput && (
        <div className="space-y-2">
          <Label htmlFor="shopify-email">
            Shopify Purchase Email
            <Small className="text-muted-foreground ml-2">
              (if different from your account email)
            </Small>
          </Label>
          <Input
            id="shopify-email"
            type="email"
            placeholder={userEmail || "email@example.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleLinkAccount();
              }
            }}
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <P className="text-sm font-medium text-destructive">Error</P>
            <Small className="text-destructive/80">{error}</Small>
          </div>
        </div>
      )}

      <Button
        onClick={handleLinkAccount}
        disabled={isLoading || (!showEmailInput && !userEmail)}
        variant={buttonVariant}
        size={buttonSize}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Linking...
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Link Shopify Account
          </>
        )}
      </Button>

      {!showEmailInput && userEmail && (
        <Small className="text-muted-foreground">
          We'll search for your Shopify account using: {userEmail}
        </Small>
      )}
    </div>
  );
}
