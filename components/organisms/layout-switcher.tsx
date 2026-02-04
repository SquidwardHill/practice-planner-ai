"use client";

import { usePathname } from "next/navigation";
import { useUserAccess } from "@/hooks/useUserAccess";
import { Navigation } from "@/components/organisms/navigation";
import { Footer } from "@/components/organisms/footer";

/**
 * On the dashboard (pathname "/" when authenticated), we render only children
 * (sidebar + main). Otherwise we render Nav + main + Footer.
 */
export function LayoutSwitcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, hasAccess } = useUserAccess();
  const isDashboard = pathname === "/" && isAuthenticated && hasAccess;

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <main>{children}</main>
      <Footer />
    </>
  );
}
