import Link from "next/link";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { ArrowRight, LineSquiggle, WandSparkles, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DashboardSummaryCards } from "@/components/molecules/dashboard-summary-cards";
import { DashboardCalendar } from "@/components/molecules/calendar-practice-schedule";
import { AI_NAME } from "@/lib/config/branding";
import { HeroSection } from "@/components/molecules/section-hero";
import { SectionPitch } from "@/components/molecules/section-pitch";
import { TitleWithAccent } from "@/components/molecules/title-with-accent";
import { SectionCta } from "@/components/molecules/section-cta";
import { FeatureCardsSection } from "@/components/molecules/feature-cards-section";
import { dashboardFeatures } from "@/lib/data/features";

export default async function Home() {
  const { user, access } = await getAuthState();

  // If authenticated AND has access, show internal dashboard with real stats
  if (user && access.hasAccess) {
    const supabase = await createClient();

    const [
      { count: drillCount },
      { data: plans, count: plansCount },
      { count: scheduledCount },
      { count: categoriesCount },
    ] = await Promise.all([
      supabase
        .from("drills")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("practice_plans")
        .select("id, practice_title, created_at", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("scheduled_practices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const drillTotal = drillCount ?? 0;
    const plansTotal = plansCount ?? 0;

    return (
      <div className="bg-background relative flex max-w-6xl mx-auto flex-1 flex-col min-h-0">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
          <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
          <Link href="/planner">
            <Button size="sm">Quick Create</Button>
          </Link>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <DashboardSummaryCards
            plansCount={plansTotal}
            scheduledCount={scheduledCount ?? 0}
            drillCount={drillTotal}
            categoriesCount={categoriesCount ?? 0}
            aiName={AI_NAME}
            className="mb-8"
          />
          <section id="calendar" className="scroll-mt-8">
            <DashboardCalendar scheduledCount={scheduledCount ?? 0} />
          </section>
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
          title="AI-powered planning has arrived"
          description={`Generate drills and organize your practice plans using natural, conversational prompts. You can focus on the big picture while ${AI_NAME} handles the details.`}
          buttonText="Give it a shot"
          buttonHref="/auth/sign-up"
          buttonIcon={LineSquiggle}
          secondaryButtonText="Sign in"
          secondaryButtonHref="/auth/login"
        />
      </div>

      {/* Features Section */}
      <SectionPitch
        title={
          <TitleWithAccent
            prefix="Meet "
            accent={AI_NAME}
            suffix=", your new AI assitant coach"
            className="max-w-3xl mx-auto"
          />
        }
        description="Generate drills in seconds  from YouTube videos, digital content, drill list uploads, and user prompts. Practice planning has never been easier."
        ctaLink="/auth/sign-up"
        ctaText="Get started"
        secondaryCtaLink="/auth/login"
        secondaryCtaText="Sign in"
      />
      <FeatureCardsSection features={dashboardFeatures} className="mb-10" />

      {/* CTA Section */}
      <SectionCta
        title="Transform your practice planning"
        description={`Try ${AI_NAME} free for 14 days. Create unlimited drills, instantly convert media to drills, and streamline your practice planning with ${AI_NAME}.`}
        buttonText="Try for free"
        buttonHref="/auth/sign-up"
        buttonIcon={ArrowRight}
        secondaryButtonText="Sign in"
        secondaryButtonHref="/auth/login"
      />
    </div>
  );
}
