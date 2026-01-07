"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Upload, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DocItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DocCategory {
  label: string;
  items: DocItem[];
  defaultOpen?: boolean;
}

const docCategories: DocCategory[] = [
  {
    label: "Getting started",
    defaultOpen: true,
    items: [
      {
        title: "Migration Guide",
        href: "/docs/migration-guide",
        icon: Upload,
      },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      docCategories.forEach((cat) => {
        initial[cat.label] = cat.defaultOpen ?? false;
        // Open category if current page is in it
        if (cat.items.some((item) => item.href === pathname)) {
          initial[cat.label] = true;
        }
      });
      return initial;
    }
  );

  const toggleCategory = (label: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 pt-22 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/docs" className="flex items-center gap-2">
            <Image
              src="/logo/planner-ai-logo-icon-blue.svg"
              alt="Logo"
              width={36}
              height={40}
              className="h-6 w-auto object-contain mb-1"
            />
            <span className="font-semibold text-sm">Documentation</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {docCategories.map((category) => {
          const isOpen = openCategories[category.label] ?? false;
          const hasActiveItem = category.items.some(
            (item) => item.href === pathname
          );

          return (
            <SidebarGroup key={category.label}>
              <Collapsible
                open={isOpen}
                onOpenChange={() => toggleCategory(category.label)}
              >
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 -mx-1">
                    <div className="flex items-center justify-between w-full">
                      <span>{category.label}</span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link href={item.href}>
                                <Icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
