import type { Metadata } from "next";
import { Space_Grotesk, Bricolage_Grotesque, Sora } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
  const authState = await getAuthState();

  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${bricolageGrotesque.variable} ${sora.variable} font-sans antialiased`}
      >
        <Navigation
          user={authState.user}
          subscription={authState.subscription}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
