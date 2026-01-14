"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Calendar, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/atoms/logout-button";
import { SubscriptionStatusBadge } from "@/components/atoms/subscription-status-badge";
import { useUserAccess } from "@/hooks/useUserAccess";
import { Logo } from "@/components/atoms/logo";

export function Navigation({ useLogoFull = false }: { useLogoFull?: boolean }) {
  const pathname = usePathname();
  const { isAuthenticated, hasAccess, subscriptionStatus, isLoading } =
    useUserAccess();

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
      requiresAuth: false,
      requiresAccess: true,
    },
    {
      href: "/library",
      label: "Library",
      icon: Library,
      requiresAuth: true,
      requiresAccess: true,
    },
    {
      href: "/planner",
      label: "Planner",
      icon: Calendar,
      requiresAuth: true,
      requiresAccess: true,
    },
    {
      href: "/profile",
      label: "Account",
      icon: User,
      requiresAuth: true,
    },
  ];

  // Filter nav items based on auth/access requirements
  const visibleNavItems = navItems.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.requiresAccess && !hasAccess) return true; // Show but locked
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container max-w-6xl mx-auto px-6 py-1">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80 py-4"
          >
            {useLogoFull ? <Logo variant="full" /> : <Logo variant="icon" />}
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-6">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isLocked = item.requiresAccess && !hasAccess;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 text-base font-medium transition-colors",
                    isActive
                      ? "text-primary saturate-75"
                      : "text-muted-foreground hover:text-primary saturate-105",
                    isLocked && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                    }
                  }}
                  title={isLocked ? "Subscription required" : undefined}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{item.label}</span>
                    {isLocked && <Lock className="h-3 w-3" />}
                  </div>
                  {item.label === "Account" && subscriptionStatus && (
                    <SubscriptionStatusBadge
                      status={subscriptionStatus}
                      iconOnly={true}
                      className="ml-1"
                    />
                  )}
                </Link>
              );
            })}

            {/* Auth Actions */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm" className="text-sm font-medium">
                    Sign up
                  </Button>
                </Link>
              </div>
            ) : (
              <LogoutButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
