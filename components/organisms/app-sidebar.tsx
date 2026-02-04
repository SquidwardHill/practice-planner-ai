"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Calendar, User } from "lucide-react";
import { type ReactNode } from "react";
import { Logo } from "@/components/atoms/logo";
import { LogoutButton } from "@/components/atoms/logout-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/library", label: "Library", icon: Library },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/profile", label: "Account", icon: User },
];

export function AppSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 px-2 py-2">
            <Logo variant="icon" />
            <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Practice Planner
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Home</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="px-2 py-2">
            <LogoutButton />
          </div>
        </SidebarFooter>
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
