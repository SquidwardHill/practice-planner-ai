import { getAuthState } from "@/lib/supabase/auth-helpers";
import {
  Calendar,
  Library,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Upload,
  FileText,
} from "lucide-react";
import { Greeting } from "@/components/greeting";
import { HelpForm } from "@/components/help-form";
import { FeatureGrid, type Feature } from "@/components/feature-grid";
import { RecentActivity, type ActivityItem } from "@/components/recent-activity";

export default async function Home() {
  const { user } = await getAuthState();

  // If authenticated, show internal dashboard
  if (user) {
    const features: Feature[] = [
      {
        icon: Library,
        title: "Drill Library",
        description:
          "Build and manage your collection of practice drills. Create drills manually, use AI, or import from YouTube and websites.",
        href: "/library",
      },
      {
        icon: Sparkles,
        title: "AI Drill Creator",
        description:
          "Generate custom drills using natural language prompts. Describe what you need and AI creates structured drills for you.",
        href: "/library",
      },
      {
        icon: Upload,
        title: "Import from YouTube",
        description:
          "Import drills from YouTube videos. Our AI extracts drill information from video transcripts automatically.",
        href: "/library",
      },
      {
        icon: BookOpen,
        title: "Import from Web",
        description:
          "Import drills from articles and websites. AI extracts drill content with 70-85% accuracy for you to review.",
        href: "/library",
      },
      {
        icon: Calendar,
        title: "Practice Planner",
        description:
          "Generate AI-powered practice plans based on duration, age group, and focus areas. Plans are built from your drill library.",
        href: "/planner",
      },
      {
        icon: FileText,
        title: "Save & Organize",
        description:
          "Save practice plans to your calendar, edit them, duplicate for future sessions, and organize your coaching workflow.",
        href: "/planner",
      },
    ];

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
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">
            <Greeting firstName={user.full_name} />
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Continue building your practice plans and managing your drill library
          </p>
        </div>

        <FeatureGrid features={features} hasAccess={true} />

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
      <div className="grid gap-8 md:grid-cols-3 mb-16">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>AI-Powered Generation</CardTitle>
            <CardDescription>
              Generate practice plans and drills using natural language. Describe
              what you need and AI creates structured content for you.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Library className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Comprehensive Drill Library</CardTitle>
            <CardDescription>
              Build and organize your drill collection. Import from YouTube,
              websites, create manually, or use AI to generate new drills.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Smart Practice Planning</CardTitle>
            <CardDescription>
              Create practice plans tailored to your team's needs. Set duration,
              age group, focus areas, and let AI build the perfect plan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/50 rounded-lg p-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Why Practice Planner AI?
        </h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Save Time</h3>
              <p className="text-sm text-muted-foreground">
                Generate practice plans in minutes instead of hours
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Organize Everything</h3>
              <p className="text-sm text-muted-foreground">
                Keep all your drills and plans in one centralized location
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">AI Assistance</h3>
              <p className="text-sm text-muted-foreground">
                Get AI-powered suggestions and content generation
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Easy Import</h3>
              <p className="text-sm text-muted-foreground">
                Import drills from YouTube videos and websites automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to get started?</CardTitle>
            <CardDescription className="text-base">
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
