import { getAuthState } from "@/lib/supabase/auth-helpers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Library, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { H1, H3, P, Small } from "@/components/atoms/typography";

interface ImportSuccessPageProps {
  searchParams: Promise<{ imported?: string; skipped?: string }>;
}

export default async function ImportSuccessPage({
  searchParams,
}: ImportSuccessPageProps) {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const imported = params.imported ? parseInt(params.imported, 10) : 0;
  const skipped = params.skipped ? parseInt(params.skipped, 10) : 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Import Success</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
        </div>
        <H1 className="mb-2">Import Successful!</H1>
        <P className="text-muted-foreground">
          {imported > 0
            ? `${imported} drill${imported !== 1 ? "s" : ""} ${
                imported === 1 ? "has" : "have"
              } been successfully imported into your library`
            : "Your import has been processed"}
        </P>
        {skipped > 0 && (
          <Small className="text-muted-foreground mt-2">
            {skipped} drill{skipped !== 1 ? "s were" : " was"} skipped
            (duplicates or errors)
          </Small>
        )}
      </div>

      <div className="mb-12">
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
          <Library className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <P className="font-medium mb-1">View Your Drill Library</P>
            <Small className="text-muted-foreground">
              Browse, edit, and organize your imported drills
            </Small>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Link href="/library">
          <Button size="lg">
            Go to Library
            <Library className=" h-4 w-4" />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="lg">
            Back to Dashboard
            <ArrowRight className="   h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
