"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Library, Calendar, User, LogIn, Info } from "lucide-react";
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
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold flex items-center gap-2"
          >
            <Image
              src="/rounded-logo.png"
              alt="Logo"
              width={48}
              height={56}
              className="h-12 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
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
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(isLocked && "opacity-60")}
                      disabled={isLocked}
                      title={isLocked ? "Subscription required" : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {isLocked && <span className="ml-1 text-xs">🔒</span>}
                      {item.label === "Account" && subscription && (
                        <SubscriptionStatusBadge
                          status={subscription.status}
                          className="ml-1"
                        />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
            {isAuthenticated ? (
              <>
                {subscription?.isTrial && (
                  <span className="text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded">
                    Trial
                  </span>
                )}
                {subscription?.status === "unset" && (
                  <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    No Subscription
                  </span>
                )}
                {subscription?.status === "expired" && (
                  <span className="text-xs text-muted-foreground bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
                    Expired
                  </span>
                )}
                {subscription?.status === "cancelled" && (
                  <span className="text-xs text-muted-foreground bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
                    Cancelled
                  </span>
                )}
                <LogoutButton />
              </>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
