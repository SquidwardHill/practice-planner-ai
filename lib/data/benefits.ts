import { Clock, Target, Zap, Users, CheckCircle2 } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Benefits for welcome page (with icons)
export const welcomeBenefits: Benefit[] = [
  {
    icon: Clock,
    title: "Save Hours Every Week",
    description:
      "Generate complete practice plans in minutes instead of spending hours planning each session",
  },
  {
    icon: Target,
    title: "Build Better Practices",
    description:
      "AI helps you create structured, age-appropriate plans that keep players engaged and improving",
  },
  {
    icon: Zap,
    title: "Organize Everything in One Place",
    description:
      "Keep all your drills, plans, and coaching resources organized and easily accessible",
  },
  {
    icon: Users,
    title: "Adapt to Any Team",
    description:
      "Customize plans for different age groups, skill levels, and focus areas with ease",
  },
];

// Benefits for public marketing page (simplified, uses CheckCircle2 icon)
export interface SimpleBenefit {
  title: string;
  description: string;
}

export const publicBenefits: SimpleBenefit[] = [
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

