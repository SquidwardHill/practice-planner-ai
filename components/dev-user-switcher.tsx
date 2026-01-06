"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, LogOut, Code, Database } from "lucide-react";

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
      fetch("/api/dev/current-user")
        .then((res) => res.json())
        .then((data) => {
          if (data.email) {
            setCurrentUser(data.email);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, []);

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
        // Refresh the page to update auth state
        router.refresh();
      } else {
        console.error("Failed to switch user");
      }
    } catch (error) {
      console.error("Error switching user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/dev/sign-out", {
        method: "POST",
      });
      setCurrentUser(null);
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
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

  if (!isDev) {
    return null;
  }

  const currentUserLabel =
    TEST_USERS.find((u) => u.email === currentUser)?.label ||
    currentUser ||
    "Not signed in";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-green-400 bg-white backdrop-blur-sm border shadow-[0_0_10px_rgba(34,197,94,0.6)]"
            disabled={isLoading}
          >
            <Users className="h-4 w-4  " />
            {isLoading ? "Switching..." : currentUserLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Switch User (Dev Only)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TEST_USERS.map((user) => (
            <DropdownMenuItem
              key={user.email}
              onClick={() => handleSwitchUser(user.email)}
              className={currentUser === user.email ? "bg-accent" : ""}
            >
              {user.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSeedDatabase}>
            <Database className="h-4 w-4  " />
            Seed Database
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4  " />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
