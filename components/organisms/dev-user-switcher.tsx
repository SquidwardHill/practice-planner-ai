"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Users, LogOut, Database, Trash2, Code } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PRACTICE_PLAN_STORAGE_KEY } from "@/lib/storage-keys";

// Test users from seed script
const TEST_USERS = [
  {
    email: "active@test.com",
    label: "Active Subscription",
    subscription_status: "active",
  },
  {
    email: "trial@test.com",
    label: "Trial Subscription",
    subscription_status: "trial",
  },
  {
    email: "unset@test.com",
    label: "No Subscription",
    subscription_status: "unset",
  },
  {
    email: "expired@test.com",
    label: "Expired Subscription",
    subscription_status: "expired",
  },
  {
    email: "cancelled@test.com",
    label: "Cancelled Subscription",
    subscription_status: "cancelled",
  },
];

const PASSWORD = "test123"; // All test users use the same password

export function DevUserSwitcher() {
  const [isDev, setIsDev] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show in development, localhost, or Vercel preview/staging
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "";
    const isDevelopment =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app") ||
      process.env.NODE_ENV === "development";
    setIsDev(isDevelopment);

    if (isDevelopment) {
      // Get current user email
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/dev/current-user");
      const data = await res.json();
      if (data.email) {
        setCurrentUser(data.email);
      }
    } catch {
      // Ignore errors
    }
  };

  const handleSwitchUser = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dev/switch-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: PASSWORD }),
      });

      if (response.ok) {
        setCurrentUser(email);
        // Dispatch custom event to refresh user access hooks
        window.dispatchEvent(new Event("user-access-refresh"));
        // Force a full page reload to ensure all server components update
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(
          `❌ Failed to switch user: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error switching user:", error);
      alert("❌ Error switching user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dev/sign-out", {
        method: "POST",
      });

      if (response.ok) {
        setCurrentUser(null);
        localStorage.removeItem(PRACTICE_PLAN_STORAGE_KEY);
        // Dispatch custom event to refresh user access hooks
        window.dispatchEvent(new Event("user-access-refresh"));
        // Force a full page reload
        window.location.reload();
      } else {
        alert("❌ Failed to sign out");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      alert("❌ Error signing out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dev/seed", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        alert(`✅ ${data.message || "Database seeded successfully!"}`);
        setIsOpen(false);
      } else {
        alert(`❌ Error: ${data.error || "Failed to seed database"}`);
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      alert("❌ Failed to seed database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDrills = async () => {
    if (
      !confirm(
        "⚠️ Are you sure you want to delete ALL drills for the current user? This cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/dev/clear-drills", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        alert(`✅ ${data.message || `Cleared ${data.deleted || 0} drill(s)`}`);
        setIsOpen(false);
        // Refresh the page to show updated drill list
        router.refresh();
      } else {
        alert(`❌ Error: ${data.error || "Failed to clear drills"}`);
      }
    } catch (error) {
      console.error("Error clearing drills:", error);
      alert("❌ Failed to clear drills");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDev) {
    return null;
  }

  const currentUserLabel =
    TEST_USERS.find((u) => u.email === currentUser)?.label ||
    currentUser ||
    "Not signed in";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-green-400 bg-white backdrop-blur-sm border shadow-[0_0_10px_rgba(34,197,94,0.6)]"
            disabled={isLoading}
          >
            <Code className="h-4 w-4 mr-2" />
            {isLoading ? "Loading..." : "Dev Actions"}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] px-6">
          <SheetHeader>
            <SheetTitle>Developer Actions</SheetTitle>
            <SheetDescription>
              Dev-only tools for testing and development
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Current User Info */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Current User
              </div>
              <div className="font-medium">{currentUserLabel}</div>
              {currentUser && (
                <div className="text-xs text-muted-foreground mt-1">
                  {currentUser}
                </div>
              )}
            </div>

            <Separator />

            {/* Switch User Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Switch User
              </h3>
              <div className="space-y-2">
                {TEST_USERS.map((user) => (
                  <Button
                    key={user.email}
                    variant={currentUser === user.email ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleSwitchUser(user.email)}
                    disabled={isLoading || currentUser === user.email}
                  >
                    {user.label}
                    {currentUser === user.email && (
                      <span className="ml-auto text-xs">(Current)</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Data Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Data Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleClearDrills}
                  disabled={isLoading || !currentUser}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Drills (Current User)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSeedDatabase}
                  disabled={isLoading}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Seed Database
                </Button>
              </div>
            </div>

            <Separator />

            {/* Sign Out */}
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
              disabled={isLoading || !currentUser}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
