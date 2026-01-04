import { getAuthState } from "@/lib/supabase/auth-helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Library, ArrowRight } from "lucide-react";
import { Greeting } from "@/components/greeting";
import { HelpForm } from "@/components/help-form";
import { FeatureGrid } from "@/components/feature-grid";
import {
  RecentActivity,
  type ActivityItem,
} from "@/components/recent-activity";
import { dashboardFeatures } from "@/lib/data/features";
import { publicFeatureCards } from "@/lib/data/features";
import { publicBenefits } from "@/lib/data/benefits";
import { FeatureCardsSection } from "@/components/feature-cards-section";
import { BenefitsSection } from "@/components/benefits-section";
import { DrillImportActions } from "@/components/drill-import-actions";

export default async function Home() {
  const { user } = await getAuthState();

  // If authenticated, show internal dashboard
  if (user) {
    // Mock recent activity data - replace with actual data from database
    const recentActivity: ActivityItem[] = [
      {
        type: "practice_plan",
        title: "Varsity Transition Defense Practice",
        date: "2 hours ago",
        icon: Calendar,
      },
      {
        type: "drill",
        title: "3-Man Weave",
        date: "1 day ago",
        icon: Library,
      },
      {
        type: "practice_plan",
        title: "Shooting Fundamentals Plan",
        date: "3 days ago",
        icon: Calendar,
      },
    ];

    return (
      // Active Subscription content
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-20 text-center">
          <h1 className="text-4xl font-bold mb-4">
            <Greeting firstName={user.full_name} />
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
            <strong>
              Do you have an existing library of drills from another system?
            </strong>
            &nbsp; We support migrations from PracticePlannerLive! Download your
            drill data and import here. If you're coming from another system,
            use our XLS template for manual import.
          </p>
          <DrillImportActions />
        </div>

        <FeatureGrid features={dashboardFeatures} hasAccess={true} />

        <div className="grid gap-6 md:grid-cols-2">
          <RecentActivity activities={recentActivity} />
          <HelpForm />
        </div>
      </div>
    );
  }

  // Public marketing page for unauthenticated users

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6">
          AI-Powered Basketball Practice Planning
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Generate structured practice plans, manage your drill library, and
          streamline your coaching workflow with AI assistance.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-8">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="text-lg px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <FeatureCardsSection features={publicFeatureCards} className="mb-16" />

      {/* Benefits Section */}
      <div className="bg-muted/50 rounded-xl border shadow-sm p-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Why Practice Planner AI?
        </h2>
        <BenefitsSection benefits={publicBenefits} variant="public" />
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <Card className="border-transparent bg-transparent">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground mb-3">
              Ready to get started?
            </CardTitle>
            <CardDescription className="text-lg">
              Join coaches who are already using AI to streamline their practice
              planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-lg px-8">
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
