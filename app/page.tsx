import { getAuthState } from "@/lib/supabase/auth-helpers";
import { Library, ArrowRight, Dribbble } from "lucide-react";
import { Greeting } from "@/components/atoms/greeting";
import { dashboardFeatures } from "@/lib/data/features";
import { FeatureCardsSection } from "@/components/molecules/feature-cards-section";
import { DashboardCalendar } from "@/components/molecules/calendar-practice-schedule";
import { type Drill } from "@/lib/types/drill";
import { H2, H3 } from "@/components/atoms/typography";
import { HeroSection } from "@/components/molecules/section-hero";
import { SectionPitch } from "@/components/molecules/section-pitch";
import { TitleWithAccent } from "@/components/molecules/title-with-accent";
import { SectionCta } from "@/components/molecules/section-cta";
import { AI_NAME } from "@/lib/config/branding";
import { DividerSection } from "@/components/atoms/divider-section";

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
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl mt-6">
        {/* Features Section */}
        <SectionPitch
          title={
            <H2>
              <Greeting firstName={user.full_name} />
            </H2>
          }
          description={`What's on the docket today? ${AI_NAME} is on stand-by whenever you're ready to start planning.`}
          ctaLink="/library"
          ctaText="Start building"
          ctaButtonVariant="default"
        />

        <FeatureCardsSection features={dashboardFeatures} hasAccess={true} />
        <DividerSection />

        <section className="mt-10">
          <DashboardCalendar />
        </section>
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
          buttonIcon={Dribbble}
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
