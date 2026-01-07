"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface DocsTableOfContentsProps {
  items: TOCItem[];
  onItemClick?: (id: string) => void;
}

export function DocsTableOfContents({ items, onItemClick }: DocsTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -80% 0%" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      items.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-20 hidden xl:block w-64 shrink-0">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          On this page
        </h3>
        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                if (onItemClick) {
                  e.preventDefault();
                  onItemClick(item.id);
                  // Scroll to element after a brief delay to allow accordion to open
                  setTimeout(() => {
                    const element = document.getElementById(item.id);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }, 100);
                }
              }}
              className={cn(
                "block text-sm transition-colors hover:text-foreground",
                item.level === 2 && "pl-0",
                item.level === 3 && "pl-4",
                item.level === 4 && "pl-8",
                activeId === item.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
