import type { Metadata } from "next";
import { Bricolage_Grotesque, Sora } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { DevUserSwitcher } from "@/components/dev-user-switcher";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Practice Planner AI",
  description: "AI-powered basketball practice plan generator",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let authState;
  try {
    authState = await getAuthState();
  } catch (error) {
    // if auth fails- handle refresh token errors and other auth issues
    authState = {
      user: null,
      subscription: null,
    };
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bricolageGrotesque.variable} ${sora.variable} font-sans antialiased text-color-primary`}
        suppressHydrationWarning
      >
        <Navigation
          user={authState.user}
          subscription={authState.subscription}
        />
        <main>{children}</main>
        <DevUserSwitcher />
      </body>
    </html>
  );
}
