"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Library, Calendar, User, LogIn } from "lucide-react";
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
      label: "Home",
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
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
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
                      "flex items-center gap-2 text-base font-medium transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      isLocked && "opacity-50 cursor-not-allowed"
                    )}
                    title={isLocked ? "Subscription required" : undefined}
                    onClick={(e) => {
                      if (isLocked) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {isLocked && <span className="text-xs opacity-60">🔒</span>}
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
                  {/* Subscription Status - Minimal Badge */}
                  {subscription?.isTrial && (
                    <span className="hidden sm:inline-flex text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                      Trial
                    </span>
                  )}
                  {subscription?.status === "unset" && (
                    <span className="hidden sm:inline-flex text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                      No Subscription
                    </span>
                  )}
                  {subscription?.status === "expired" && (
                    <span className="hidden sm:inline-flex text-xs text-muted-foreground px-2 py-1 rounded-md bg-destructive/10 text-destructive">
                      Expired
                    </span>
                  )}
                  {subscription?.status === "cancelled" && (
                    <span className="hidden sm:inline-flex text-xs text-muted-foreground px-2 py-1 rounded-md bg-destructive/10 text-destructive">
                      Cancelled
                    </span>
                  )}
                  <LogoutButton />
                </>
              ) : (
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-base font-medium"
                  >
                    Log in
                  </Button>
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/auth/sign-up">
                  <Button size="sm" className="text-base font-medium">
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
