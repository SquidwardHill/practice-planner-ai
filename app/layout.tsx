import type { Metadata } from "next";
import { Bricolage_Grotesque, Sora } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/organisms/navigation";
import { Footer } from "@/components/organisms/footer";
import { DevUserSwitcher } from "@/components/organisms/dev-user-switcher";
import { UserAccessProvider } from "@/contexts/UserAccessContext";
import { PRODUCT_NAME } from "@/lib/config/branding";

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
  title: PRODUCT_NAME,
  description: "AI-powered basketball practice plan generator",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bricolageGrotesque.variable} ${sora.variable} font-sans antialiased text-color-primary`}
        suppressHydrationWarning
      >
        <UserAccessProvider>
          <Navigation />
          <main>{children}</main>
          <Footer />
          <DevUserSwitcher />
        </UserAccessProvider>
      </body>
    </html>
  );
}
