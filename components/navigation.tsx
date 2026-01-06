"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Library, Calendar, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { SubscriptionStatusBadge } from "@/components/subscription-status-badge";

interface NavigationProps {
  user: {
    id: string;
    email?: string;
  } | null;
  subscription: {
    status: string;
    isValid: boolean;
    isTrial: boolean;
    hasLinkedAccount: boolean;
  } | null;
}

export function Navigation({ user, subscription }: NavigationProps) {
  const pathname = usePathname();

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
    },
    {
      href: "/library",
      label: "Library",
      icon: Library,
      requiresAuth: true,
    },
    {
      href: "/planner",
      label: "Planner",
      icon: Calendar,
      requiresAuth: true,
      requiresSubscription: true,
    },
    {
      href: "/profile",
      label: "Account",
      icon: User,
      requiresAuth: true,
    },
  ];

  const isAuthenticated = !!user;
  const hasActiveSubscription = subscription?.isValid ?? false;

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
              src="/logo/planner-ai-light-mode.svg"
              alt="Practice Planner AI"
              width={218}
              height={100}
              className="h-8 w-auto object-contain dark:hidden"
              suppressHydrationWarning
              priority
            />
            <Image
              src="/logo/planner-ai-dark-mode.svg"
              alt="Practice Planner AI"
              width={218}
              height={100}
              className="h-8 w-auto object-contain hidden dark:block"
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
                const isLocked =
                  item.requiresSubscription && !hasActiveSubscription;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-active-nav"
                        : "text-muted-foreground hover:text-active-nav-hover",
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
                      {/* <Icon className="h-4 w-4" /> */}
                      <span>{item.label}</span>
                      {isLocked && (
                        <Lock className="h-4 w-4 opacity-100 color-red-500 mb-1" />
                      )}
                    </div>
                    {item.label === "Account" && subscription && (
                      <SubscriptionStatusBadge
                        status={subscription.status}
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
