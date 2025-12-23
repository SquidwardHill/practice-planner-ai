import { getAuthState } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Library, Sparkles } from "lucide-react";

export default async function Home() {
  const { user } = await getAuthState();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Practice Planner AI</h1>
        <p className="text-muted-foreground text-lg">
          Generate structured basketball practice plans with AI
        </p>
      </div>

      {user ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Practice Planner
              </CardTitle>
              <CardDescription>
                Generate AI-powered practice plans from your drill library
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/planner">
                <Button className="w-full">Go to Planner</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5" />
                Drill Library
              </CardTitle>
              <CardDescription>
                Manage your collection of practice drills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/library">
                <Button variant="outline" className="w-full">
                  View Library
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Get Started
              </CardTitle>
              <CardDescription>
                Sign in to start creating practice plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Create AI-powered basketball practice plans tailored to your
                team's needs.
              </p>
              <Link href="/auth/login">
                <Button className="w-full">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
