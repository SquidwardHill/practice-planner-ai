import { getAuthState } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DocsSidebar } from "@/components/organisms/docs-sidebar";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <SidebarProvider>
      <DocsSidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="flex">
          <div className="flex-1 min-w-0">
            <div className="mx-auto px-8 py-12 max-w-6xl">{children}</div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
