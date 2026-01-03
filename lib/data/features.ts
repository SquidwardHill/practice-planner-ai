import {
  Calendar,
  Library,
  Sparkles,
  BookOpen,
  Upload,
  FileText,
} from "lucide-react";
import { type Feature } from "@/components/feature-grid";
import { LucideIcon } from "lucide-react";

// Full feature list for authenticated users (with hrefs)
export const allFeatures: Feature[] = [
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

// Simplified feature list for authenticated dashboard
export const dashboardFeatures: Feature[] = [
  {
    icon: Library,
    title: "Drill Library",
    description: "Manage your drill library. Create, edit, and delete drills.",
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

// Feature cards for public marketing page (no hrefs, just display)
export interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const publicFeatureCards: FeatureCard[] = [
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
