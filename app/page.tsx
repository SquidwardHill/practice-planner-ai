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
import { H1, H2, Lead, P } from "@/components/typography";

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-16 text-center">
          <H1 className="mb-3">
            <Greeting firstName={user.full_name} />
          </H1>
          <Lead className="max-w-2xl mx-auto mb-6">
            Do you have an existing library of drills from another system? We
            support migrations from PracticePlannerLive! Download your drill
            data and import here. If you're coming from another system, use our
            XLS template for manual import.
          </Lead>
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <H1 className="mb-4">AI-Powered Basketball Practice Planning</H1>
        <Lead className="mb-8 max-w-2xl mx-auto">
          Generate structured practice plans, manage your drill library, and
          streamline your coaching workflow with AI assistance.
        </Lead>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/sign-up">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <FeatureCardsSection features={publicFeatureCards} className="mb-16" />

      {/* Benefits Section */}
      <div className="mb-16">
        <H2 className="text-center mb-6">Why Practice Planner AI?</H2>
        <BenefitsSection benefits={publicBenefits} variant="public" />
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <H2 className="mb-2">Ready to get started?</H2>
        <P className="text-muted-foreground mb-6">
          Join coaches who are already using AI to streamline their practice
          planning
        </P>
        <Link href="/auth/sign-up">
          <Button size="lg">
            Create Your Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
