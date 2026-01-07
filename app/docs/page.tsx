import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload } from "lucide-react";
import Link from "next/link";
import { H1, H2, P } from "@/components/atoms/typography";
import { PRODUCT_NAME } from "@/lib/config/branding";

interface DocCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categoryDocs: Record<string, DocCard[]> = {
  "Getting Started": [
    {
      title: "Migration Guide",
      description:
        "Import your drill library from PracticePlannerLive or use our XLS template",
      href: "/docs/migration-guide",
      icon: Upload,
    },
  ],
  // 🔌 TODO: Add more categories/docs as needed
  // 🔌 TODO: Dynamic data -> DB tables [potentially incorporate CMS for docs, copy, etc.]
};

export default function DocsPage() {
  return (
    <div>
      <div className="mb-16">
        <H1 className="mb-4">
          {PRODUCT_NAME} Docs
        </H1>
        <P className="text-lg text-muted-foreground max-w-2xl">
          Get an overview of features, guides, and how to use {PRODUCT_NAME}.
        </P>
      </div>

      {/* Category Sections */}
      {Object.entries(categoryDocs).map(([category, docs]) => (
        <div key={category} className="mb-16">
          <H2 className="mb-6">{category}</H2>
          <div className="grid gap-4 md:grid-cols-2">
            {docs.map((doc) => {
              const Icon = doc.icon;
              return (
                <Link key={doc.href} href={doc.href}>
                  <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            {doc.title}
                          </CardTitle>
                          <CardDescription className="text-base leading-relaxed">
                            {doc.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
