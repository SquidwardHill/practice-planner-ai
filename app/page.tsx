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
import { type Drill } from "@/lib/types/drill";
import { HeroSection } from "@/components/molecules/section-hero";
import { SectionPitch } from "@/components/molecules/section-pitch";
import { TitleWithAccent } from "@/components/molecules/title-with-accent";
import { SectionCta } from "@/components/molecules/section-cta";

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
      <div className="mb-16">
        <HeroSection
          hasLogo={true}
          title="Coaches, ai-powered planning is here"
          description="Generate drills and organize your practice plans using natural, conversational prompts. You can focus on the big picture while planner ai handles the details."
          buttonText="Give it a whirl"
          buttonHref="/auth/sign-up"
          buttonIcon={Balloon}
        />
      </div>

      {/* Features Section */}
      <SectionPitch
        title={
          <TitleWithAccent
            prefix="Let"
            accent="planner ai"
            suffix="lighten your load"
            className="max-w-3xl mx-auto"
          />
        }
        description="Generate drills in seconds by importing YouTube videos, articles, or websites. If you prefer a collaborative approach, share your goals and ideas with AI and let it do the heavy lifting."
      />
      <FeatureCardsSection features={dashboardFeatures} className="mb-20" />

      {/* CTA Section */}
      <SectionCta
        title="Transform your practice planning"
        description="Try plannerAI free for 14 days. Create unlimited drills, instantly convert media to drills, and streamline your practice planning with plannerAI."
        buttonText="Try for free"
        buttonHref="/auth/sign-up"
        buttonIcon={ArrowRight}
      />
    </div>
  );
}
