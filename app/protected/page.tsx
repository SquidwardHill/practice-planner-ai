import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/atoms/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <P>
        Hello <span>{data.claims.email}</span>
      </P>
      <LogoutButton />
    </div>
  );
}
