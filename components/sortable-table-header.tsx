"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface SortableTableHeaderProps {
  column: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableTableHeader({
  column,
  children,
  className,
}: SortableTableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sortBy") || "";
  const currentOrder = searchParams.get("sortOrder") || "asc";

  const isSorted = currentSort === column;
  const isAsc = isSorted && currentOrder === "asc";

  const handleSort = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (isSorted && isAsc) {
      // Toggle to descending
      params.set("sortBy", column);
      params.set("sortOrder", "desc");
    } else if (isSorted && !isAsc) {
      // Remove sort (back to default)
      params.delete("sortBy");
      params.delete("sortOrder");
    } else {
      // Set to ascending
      params.set("sortBy", column);
      params.set("sortOrder", "asc");
    }

    // Reset to page 1 when sorting changes
    params.set("page", "1");

    router.push(`/library?${params.toString()}`);
  };

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={handleSort}
      >
        <span>{children}</span>
        {isSorted ? (
          isAsc ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    </TableHead>
  );
}
