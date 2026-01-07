"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Library, Calendar, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/atoms/logout-button";
import { SubscriptionStatusBadge } from "@/components/atoms/subscription-status-badge";
import { useUserAccess } from "@/hooks/useUserAccess";

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, hasAccess, subscriptionStatus, isLoading } =
    useUserAccess();

  // Don't show navigation on auth pages
  if (pathname?.startsWith("/auth")) {
    return null;
  }

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

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container max-w-6xl mx-auto px-6 py-1">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80 py-4"
          >
            <Image
              src="/logo/planner-ai-logo-light-mode.svg"
              alt="Practice Planner AI"
              width={218}
              height={100}
              className="h-9 w-auto object-contain dark:hidden"
              suppressHydrationWarning
              priority
            />
            <Image
              src="/logo/planner-ai-logo-dark-mode.svg"
              alt="Practice Planner AI"
              width={218}
              height={100}
              className="h-9 w-auto object-contain hidden dark:block"
              suppressHydrationWarning
              priority
            />
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                // Skip items that require auth if not authenticated
                if (item.requiresAuth && !isAuthenticated) {
                  return null;
                }

                const Icon = item.icon;
                const isActive = pathname === item.href;

                // Check if item should be locked (requires access but user doesn't have it)
                // Don't show locked state while loading to prevent flash
                const isLocked =
                  !isLoading && item.requiresAccess && !hasAccess;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary saturate-75"
                        : "text-muted-foreground hover:text-primary saturate-105",
                      isLocked && "opacity-50 cursor-not-allowed"
                    )}
                    title={isLocked ? "Subscription required" : undefined}
                    onClick={(e) => {
                      if (isLocked) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{item.label}</span>
                      {isLocked && <Lock className="h-3 w-3" />}
                    </div>
                    {item.label === "Account" && (
                      <SubscriptionStatusBadge
                        status={subscriptionStatus}
                        className="ml-1"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium"
                  >
                    Log in
                  </Button>
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/auth/sign-up">
                  <Button size="sm" className="text-sm font-medium">
                    Sign up
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
