"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { P, Small } from "@/components/atoms/typography";

export function ImportSuccessMessage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const [skipped, setSkipped] = useState<number | null>(null);

  useEffect(() => {
    const importedParam = searchParams.get("imported");
    const skippedParam = searchParams.get("skipped");

    if (importedParam) {
      setImported(parseInt(importedParam, 10));
      setSkipped(skippedParam ? parseInt(skippedParam, 10) : null);
      setIsVisible(true);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Remove query params from URL
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("imported");
        newSearchParams.delete("skipped");
        const newUrl = newSearchParams.toString()
          ? `?${newSearchParams.toString()}`
          : "";
        router.replace(`/library${newUrl}`);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remove query params from URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete("imported");
    newSearchParams.delete("skipped");
    const newUrl = newSearchParams.toString()
      ? `?${newSearchParams.toString()}`
      : "";
    router.replace(`/library${newUrl}`);
  };

  if (!isVisible || imported === null) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div className="flex-1">
        <P className="font-medium mb-1">Import Successful!</P>
        <Small className="text-muted-foreground">
          {imported > 0
            ? `${imported} drill${imported !== 1 ? "s" : ""} ${
                imported === 1 ? "has" : "have"
              } been successfully imported into your library`
            : "Your import has been processed"}
          {skipped !== null && skipped > 0 && (
            <span className="ml-1">
              ({skipped} duplicate{skipped !== 1 ? "s" : ""} skipped)
            </span>
          )}
        </Small>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
