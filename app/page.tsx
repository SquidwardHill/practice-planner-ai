import { getAuthState } from "@/lib/supabase/auth-helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Library,
  ArrowRight,
  BookOpen,
  Balloon,
  type LucideIcon,
} from "lucide-react";
import { Greeting } from "@/components/atoms/greeting";
import { Logo } from "@/components/atoms/logo";
import { HelpForm } from "@/components/molecules/help-form";
import { FeatureGrid } from "@/components/organisms/feature-grid";
import {
  RecentActivity,
  type ActivityItem,
} from "@/components/organisms/recent-activity";
import { dashboardFeatures } from "@/lib/data/features";
import { FeatureCardsSection } from "@/components/molecules/feature-cards-section";
import { DrillImportActions } from "@/components/molecules/drill-import-actions";
import { H1, H2, Lead, P } from "@/components/atoms/typography";
import Image from "next/image";
import { type Drill } from "@/lib/types/drill";
import { HeroSection } from "@/components/molecules/section-hero";

export default async function Home({
  data: drills,
  error,
  count,
}: {
  data: Drill[];
  error: Error | null;
  count: number;
}) {
  const { user, access } = await getAuthState();

  // If authenticated AND has access, show internal dashboard
  if (user && access.hasAccess) {
    // TODO: [mocked data] replace recent activities with persisted user data
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
            What's on the docket today?
            {count === 0 ? (
              <>
                Import your drills and let PlannerAI do the rest.. or create
                something new.
              </>
            ) : (
              <>Create something new</>
            )}
          </Lead>

          <DrillImportActions variant="default" />
          <Link href="/docs">
            <Button variant="outline" size="lg">
              Documentation
              <BookOpen className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <FeatureGrid features={dashboardFeatures} hasAccess={true} />

        <div className="grid gap-6 md:grid-cols-2">
          <RecentActivity activities={recentActivity} />
          <HelpForm />
        </div>
      </div>
    );
  }

  // Unauthenticated content
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl mt-6">
      {/* Hero Section */}
      <HeroSection
        hasLogo={true}
        title="Coaches, ai-powered planning is here"
        description="Generate drills and organize your practice plans using natural, conversational prompts. You can focus on the big picture while planner ai handles the details."
        buttonText="Give it a whirl"
        buttonHref="/auth/sign-up"
        buttonIcon={Balloon}
      />

      {/* Features Section */}
      <div className="my-12 glow-primary-muted rounded-3xl">
        <div className="max-w-6xl mx-auto rounded-2xl p-px bg-linear-to-b from-primary-muted/70 via-primary-muted/40 to-background/50">
          <div className="rounded-[calc(1.2rem-1px)] p-10 bg-background text-center">
            <H2 className="max-w-3xl mx-auto pt-6">
              <span>Let</span>
              <div className="text-primary-muted items-center gap-1 inline-flex px-2">
                <Image
                  src="/logo/sparkle-trio.svg"
                  alt="Sparkle Duo"
                  width={22}
                  height={22}
                  className="contrast-75 rotate-180"
                />
                <span className="text-primary-muted">planner ai</span>
              </div>
              <span>lighten your load</span>
            </H2>
            <P className="text-muted-foreground text-xl pt-4 max-w-3xl mx-auto pb-2">
              Import YouTube videos and digital content to quickly generate
              drills, or use planner ai like a sidekick to build and manage your
              training plans. Learn how planner ai can help you streamline your
              practice planning below.
            </P>
          </div>
        </div>
      </div>
      <FeatureCardsSection features={dashboardFeatures} className="mb-20" />

      {/* CTA Section */}
      <div className="text-center bg-linear-to-b from-background via-primary/5 to-primary/40 rounded-2xl pt-4 mt-42 ">
        <div className="flex flex-col items-center justify-center bg-linear-to-b from-background via-background/65 to-primary/45 rounded-2xl pb-12">
          <H2 className="mb-2">Ready to get started?</H2>
          <P className="text-muted-foreground mb-6">
            Join coaches who are already using AI to streamline their practice
            planning
          </P>
          <Link href="/auth/sign-up" className="pb-6">
            <Button variant="light" size="lg">
              Create Your Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
