"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { MigrationGuideCTA } from "@/components/molecules/migration-guide-cta";
import { XLSTemplateDownload } from "@/components/organisms/xls-template-download";
import { DocsTableOfContents } from "@/components/organisms/docs-table-of-contents";
import { PRODUCT_NAME } from "@/lib/config/branding";

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "instructions", title: "Step-by-Step Instructions", level: 2 },
  { id: "imported-data", title: "What Gets Imported", level: 2 },
  { id: "important-notes", title: "Important Notes", level: 2 },
  { id: "xls-template", title: "XLS Template for Other Systems", level: 2 },
];

// Map TOC IDs to accordion values
const accordionValueMap: Record<string, string> = {
  instructions: "instructions",
  "imported-data": "imported-data",
  "important-notes": "important-notes",
  "xls-template": "xls-template",
};

export default function MigrationGuidePage() {
  const [accordionValue, setAccordionValue] = useState<string>("");

  const handleTOCItemClick = (id: string) => {
    // If this ID corresponds to an accordion item, open it
    const accordionItemValue = accordionValueMap[id];
    if (accordionItemValue) {
      setAccordionValue(accordionItemValue);
    }
  };
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/docs">Documentation</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Migration Guide</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Migration Guide</h1>
          <p className="text-muted-foreground text-lg">
            Import your drill library from PracticePlannerLive
          </p>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle id="overview">Overview</CardTitle>
              <CardDescription>
                How to migrate your drill data from PracticePlannerLive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-muted-foreground">
                This migration tool is specifically designed for coaches who
                have been using PracticePlannerLive and want to bring their
                existing drill library into {PRODUCT_NAME}. We've formatted
                our import system to work seamlessly with PracticePlannerLive's
                export format.
              </p>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">
                      PracticePlannerLive Format Only
                    </p>
                    <p className="text-base text-muted-foreground">
                      This import tool is optimized for PracticePlannerLive
                      exported data. If you're coming from another system,
                      please use our XLS template for manual import.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accordion Sections */}
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            {/* Step-by-Step Guide */}
            <AccordionItem value="instructions">
              <AccordionTrigger className="text-left">
                <div>
                  <h3 id="instructions" className="font-semibold text-lg">
                    Step-by-Step Instructions
                  </h3>
                  <p className="text-base text-muted-foreground font-normal">
                    Follow these steps to import your drill library
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        1
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">
                        Export from PracticePlannerLive
                      </h4>
                      <p className="text-base text-muted-foreground">
                        Log into your PracticePlannerLive account and export
                        your drill list. The export will be in .xls format. Make
                        sure you download the complete drill list with all
                        categories.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        2
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">Prepare Your File</h4>
                      <p className="text-base text-muted-foreground">
                        Ensure your exported file includes the following
                        columns:
                      </p>
                      <ul className="text-base text-muted-foreground list-disc list-inside space-y-1 ml-4">
                        <li>Category (required)</li>
                        <li>Name (required)</li>
                        <li>Minutes (optional)</li>
                        <li>Notes (optional)</li>
                        <li>Media Links (optional)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        3
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">Upload Your File</h4>
                      <p className="text-base text-muted-foreground">
                        Click the "Upload Drill List" button on your dashboard.
                        You can either drag and drop your file or click to
                        browse and select it. The file must be under 10MB in
                        size.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        4
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold">Review & Import</h4>
                      <p className="text-base text-muted-foreground">
                        Once uploaded, we'll process your file and import all
                        valid drills into your library. Duplicate drills (same
                        name) will be automatically skipped. You'll receive a
                        summary of how many drills were imported.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* What Gets Imported */}
            <AccordionItem value="imported-data">
              <AccordionTrigger className="text-left">
                <div>
                  <h3 id="imported-data" className="font-semibold text-lg">
                    What Gets Imported
                  </h3>
                  <p className="text-base text-muted-foreground font-normal">
                    Data that will be preserved during migration
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 md:grid-cols-2 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Drill Categories</p>
                      <p className="text-xs text-muted-foreground">
                        All category names are preserved
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Drill Names</p>
                      <p className="text-xs text-muted-foreground">
                        All drill names are imported as-is
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Duration (Minutes)</p>
                      <p className="text-xs text-muted-foreground">
                        Time estimates are preserved
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">
                        Notes & Instructions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All drill notes are imported
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Media Links</p>
                      <p className="text-xs text-muted-foreground">
                        Video and image links are preserved
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Important Notes */}
            <AccordionItem value="important-notes">
              <AccordionTrigger className="text-left">
                <div>
                  <h3 id="important-notes" className="font-semibold text-lg">
                    Important Notes
                  </h3>
                  <p className="text-base text-muted-foreground font-normal">
                    Things to keep in mind during migration
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">
                        Duplicate Handling
                      </p>
                      <p className="text-base text-muted-foreground">
                        If you import a drill with the same name as an existing
                        drill, the duplicate will be skipped automatically. You
                        can manually edit or delete drills after import if
                        needed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">
                        File Size Limits
                      </p>
                      <p className="text-base text-muted-foreground">
                        Maximum file size is 10MB. If your drill list is larger,
                        you may need to split it into multiple files or contact
                        support for assistance.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">Other Systems</p>
                      <p className="text-base text-muted-foreground">
                        If you're migrating from a system other than
                        PracticePlannerLive, please use our XLS template for
                        manual import. Contact support if you need assistance.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* XLS Template Download */}
            <AccordionItem value="xls-template">
              <AccordionTrigger className="text-left">
                <div>
                  <h3 id="xls-template" className="font-semibold text-lg">
                    XLS Template for Other Systems
                  </h3>
                  <p className="text-base text-muted-foreground font-normal">
                    Download a template to manually import drills from other
                    systems
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2">
                  <XLSTemplateDownload />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* CTA */}
          <MigrationGuideCTA />
        </div>
      </div>
      <DocsTableOfContents items={tocItems} onItemClick={handleTOCItemClick} />
    </div>
  );
}
