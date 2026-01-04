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

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2">Import Successful!</h1>
        <p className="text-muted-foreground text-lg">
          {imported > 0
            ? `${imported} drill${imported !== 1 ? "s" : ""} ${imported === 1 ? "has" : "have"} been successfully imported into your library`
            : "Your import has been processed"}
        </p>
        {skipped > 0 && (
          <p className="text-sm text-amber-600 mt-2">
            {skipped} drill{skipped !== 1 ? "s were" : " was"} skipped (duplicates or errors)
          </p>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Your drills are now available in your library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Library className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-1">View Your Drill Library</p>
              <p className="text-sm text-muted-foreground">
                Browse, edit, and organize your imported drills
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Link href="/library">
          <Button size="lg">
            <Library className="mr-2 h-4 w-4" />
            Go to Library
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="lg">
            Back to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

