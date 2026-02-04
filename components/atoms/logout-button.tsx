"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PRACTICE_PLAN_STORAGE_KEY } from "@/lib/storage-keys";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem(PRACTICE_PLAN_STORAGE_KEY);
    }
    router.push("/auth/login");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      className="text-base font-medium"
    >
      Logout
    </Button>
  );
}
