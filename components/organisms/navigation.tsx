"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Lock, Sparkles, ChevronDown, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubscriptionStatusBadge } from "@/components/atoms/subscription-status-badge";
import { useUserAccess } from "@/hooks/useUserAccess";
import { Logo } from "@/components/atoms/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { PRACTICE_PLAN_STORAGE_KEY } from "@/lib/storage-keys";

export function Navigation({ useLogoFull = false }: { useLogoFull?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, hasAccess, subscriptionStatus } = useUserAccess();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem(PRACTICE_PLAN_STORAGE_KEY);
    }
    router.push("/auth/login");
  };

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      requiresAuth: false,
      requiresAccess: true,
    },
    {
      href: "/library",
      label: "Library",
      requiresAuth: true,
      requiresAccess: true,
    },
    {
      href: "/planner",
      label: "Planner",
      icon: Sparkles,
      requiresAuth: true,
      requiresAccess: true,
    },
    {
      href: "/profile",
      label: "Account",
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
              const isActive = pathname === item.href;
              const isLocked = item.requiresAccess && !hasAccess;
              const Icon = item.icon;
              const isAccountDropdown =
                item.label === "Account" && isAuthenticated;

              if (isAccountDropdown) {
                return (
                  <DropdownMenu key={item.href}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-2 text-base font-light transition-colors py-4 no-underline cursor-pointer bg-transparent border-none",
                          pathname === "/profile"
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-primary saturate-105",
                        )}
                      >
                        <span className="relative flex items-center gap-1 rounded-md px-1">
                          <span
                            className={cn(
                              pathname === "/profile" && "text-primary-muted",
                            )}
                          >
                            Account
                          </span>
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2"
                        >
                          <User className="size-4" />
                          Account settings
                        </Link>
                      </DropdownMenuItem>
                      {subscriptionStatus && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="flex items-center justify-between font-normal">
                            Subscription
                            <SubscriptionStatusBadge
                              status={subscriptionStatus}
                            />
                          </DropdownMenuLabel>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={logout}
                        className="gap-2"
                      >
                        <LogOut className="size-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 text-base font-light transition-colors py-4 no-underline",
                    !isActive &&
                      "text-muted-foreground hover:text-primary saturate-105",
                    isLocked && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                    }
                  }}
                  title={isLocked ? "Subscription required" : undefined}
                >
                  {Icon && !isLocked ? (
                    <Icon className="size-3.5 text-primary-muted" />
                  ) : null}

                  <span className={cn(isActive && "text-primary-muted")}>
                    {item.label}
                  </span>

                  {isLocked && <Lock className="size-3.5" />}
                </Link>
              );
            })}

            {/* Auth Actions */}
            {!isAuthenticated && (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm" className="text-sm font-medium">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
