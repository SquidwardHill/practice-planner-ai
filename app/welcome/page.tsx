import { getAuthState } from "@/lib/supabase/auth-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Calendar,
  Library,
  Sparkles,
  BookOpen,
  Upload,
  FileText,
  Clock,
  Target,
  Zap,
  Users,
} from "lucide-react";
import { isValidSubscription } from "@/lib/types/subscription";
import { FeatureGrid, type Feature } from "@/components/feature-grid";

export default async function WelcomePage() {
  const { user, subscription } = await getAuthState();

  const hasAccess = user && subscription && isValidSubscription(subscription.status);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          {hasAccess ? "Welcome to Practice Planner AI" : "Unlock Your Coaching Potential"}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {hasAccess
            ? "Your AI-powered assistant for creating structured basketball practice plans. Get started by exploring the features below."
            : "Get access to AI-powered practice planning, drill library management, and more. Start your free trial today."}
        </p>
      </div>

      <FeatureGrid
        features={features}
        hasAccess={hasAccess ?? false}
        buttonText="Get Started"
        disabledButtonText="Unlock Access"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Why Practice Planner AI?</CardTitle>
            <CardDescription>
              Discover how this tool can transform your coaching workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Save Hours Every Week</p>
                  <p className="text-sm text-muted-foreground">
                    Generate complete practice plans in minutes instead of spending hours planning each session
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Build Better Practices</p>
                  <p className="text-sm text-muted-foreground">
                    AI helps you create structured, age-appropriate plans that keep players engaged and improving
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Organize Everything in One Place</p>
                  <p className="text-sm text-muted-foreground">
                    Keep all your drills, plans, and coaching resources organized and easily accessible
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Adapt to Any Team</p>
                  <p className="text-sm text-muted-foreground">
                    Customize plans for different age groups, skill levels, and focus areas with ease
                  </p>
                </div>
              </div>
            </div>
            {!hasAccess && (
              <div className="pt-4 border-t">
                <Link href="/profile">
                  <Button className="w-full">
                    Get Started with Free Trial
                  </Button>
                </Link>
              </div>
            )}
            {hasAccess && (
              <div className="pt-4">
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Go to Home
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="aspect-video bg-muted flex items-center justify-center">
            <div className="text-center p-8">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Graphic placeholder
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
