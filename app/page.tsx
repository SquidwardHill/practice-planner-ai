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
import {
  RecentActivity,
  type ActivityItem,
} from "@/components/recent-activity";

export default async function Home() {
  const { user } = await getAuthState();

  // If authenticated, show internal dashboard
  if (user) {
    const features: Feature[] = [
      {
        icon: Library,
        title: "Drill Library",
        description:
          "Manage your drill library. Create, edit, and delete drills.",
        href: "/library",
      },
      {
        icon: Sparkles,
        title: "AI Drill Creator",
        description:
          "Quickly generate custom drills using natural language prompts.",
        href: "/library",
      },
      {
        icon: Upload,
        title: "Import from YouTube",
        description:
          "PlannerAI will automatically extract drill information from YouTube videos.",
        href: "/library",
      },
      {
        icon: BookOpen,
        title: "Import from Web",
        description: "PlannerAI will import drills from articles and websites.",
        href: "/library",
      },
      {
        icon: Calendar,
        title: "Practice Planner",
        description:
          "Use your drill library to efficiently create your practice plans.",
        href: "/planner",
      },
      {
        icon: FileText,
        title: "Workflow",
        description:
          "Manage and edit your practice plans and organize your coaching workflow.",
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
            &nbsp; We support migrations from PracticePlannerLive! Download your drill data and import here. If you're coming from another system, use our CSV template for manual import. 
          </p>
          <Button variant="default" size="lg" className="text-lg px-8 mr-4">
            Upload Drill List
            <Upload className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8">
            Migration Guide
            <BookOpen className="ml-2 h-5 w-5" />
          </Button>
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
  const featureCards = [
    {
      icon: Sparkles,
      title: "AI-Powered Generation",
      description:
        "Generate practice plans and drills using natural language. Describe what you need and AI creates structured content for you.",
    },
    {
      icon: Library,
      title: "Comprehensive Drill Library",
      description:
        "Build and organize your drill collection. Import from YouTube, websites, create manually, or use AI to generate new drills.",
    },
    {
      icon: Calendar,
      title: "Smart Practice Planning",
      description:
        "Create practice plans tailored to your team's needs. Set duration, age group, focus areas, and let AI build the perfect plan.",
    },
  ];

  const benefits = [
    {
      title: "Save Time",
      description: "Generate practice plans in minutes instead of hours",
    },
    {
      title: "Organize Everything",
      description: "Keep all your drills and plans in one centralized location",
    },
    {
      title: "AI Assistance",
      description: "Get AI-powered suggestions and content generation",
    },
    {
      title: "Easy Import",
      description:
        "Import drills from YouTube videos and websites automatically",
    },
  ];

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
        {featureCards.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/50 rounded-xl border shadow-sm p-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Why Practice Planner AI?
        </h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1 text-lg text-card-foreground">
                  {benefit.title}
                </h3>
                <p className="text-base text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
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
