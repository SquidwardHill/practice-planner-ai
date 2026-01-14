import Link from "next/link";
import { Logo } from "@/components/atoms/logo";
import { P, Small } from "@/components/atoms/typography";
import { PRODUCT_NAME } from "@/lib/config/branding";
import { cn } from "@/lib/utils";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Library", href: "/library" },
      { label: "Planner", href: "/planner" },
      { label: "Dashboard", href: "/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Migration Guide", href: "/docs/migration-guide" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "Account", href: "/profile" }],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background mt-8">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Branding Section */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Logo variant="icon" className="h-8 w-auto mb-0" />
            </Link>
            <P className="text-muted-foreground text-sm">{PRODUCT_NAME}</P>
          </div>

          {/* Navigation Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <P className="font-semibold text-sm text-foreground">
                {section.title}
              </P>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "text-sm text-muted-foreground hover:text-foreground transition-colors"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Small className="text-muted-foreground">
              © {currentYear} {PRODUCT_NAME}. All rights reserved.
            </Small>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
