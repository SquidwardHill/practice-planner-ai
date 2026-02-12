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
import { H1, H3, H4, P, Small } from "@/components/atoms/typography";

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
          <H1 className="mb-2">Migration Guide</H1>
          <P className="text-muted-foreground text-lg">
            Import your drill library from PracticePlannerLive
          </P>
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
              <P className="text-muted-foreground">
                This migration tool is specifically designed for coaches who
                have been using PracticePlannerLive and want to bring their
                existing drill library into {PRODUCT_NAME}. We've formatted our
                import system to work seamlessly with PracticePlannerLive's
                export format.
              </P>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <Small className="font-medium mb-1">
                      PracticePlannerLive Format Only
                    </Small>
                    <P className="text-muted-foreground">
                      This import tool is optimized for PracticePlannerLive
                      exported data. If you're coming from another system,
                      please use our XLS template for manual import.
                    </P>
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
                  <H3 id="instructions">Step-by-Step Instructions</H3>
                  <P className="text-muted-foreground font-normal">
                    Follow these steps to import your drill library
                  </P>
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
                      <H4>Export from PracticePlannerLive</H4>
                      <P className="text-muted-foreground">
                        Log into your PracticePlannerLive account and export
                        your drill list. Export as .xls or save as .xlsx (Excel 2007+).
                        Make sure you download the complete drill list with all
                        categories.
                      </P>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        2
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <H4>Prepare Your File</H4>
                      <P className="text-muted-foreground">
                        Ensure your exported file includes the following
                        columns:
                      </P>
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
                      <H4>Upload Your File</H4>
                      <P className="text-muted-foreground">
                        Click the "Upload Drill List" button on your dashboard.
                        You can either drag and drop your file or click to
                        browse and select it. The file must be under 10MB in
                        size.
                      </P>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        4
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <H4>Review & Import</H4>
                      <P className="text-muted-foreground">
                        Once uploaded, we'll process your file and import all
                        valid drills into your library. Duplicate drills (same
                        name) will be automatically skipped. You'll receive a
                        summary of how many drills were imported.
                      </P>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* What Gets Imported */}
            <AccordionItem value="imported-data">
              <AccordionTrigger className="text-left">
                <div>
                  <H3 id="imported-data">What Gets Imported</H3>
                  <P className="text-muted-foreground font-normal">
                    Data that will be preserved during migration
                  </P>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 md:grid-cols-2 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <Small className="font-medium">Drill Categories</Small>
                      <Small className="text-muted-foreground">
                        All category names are preserved
                      </Small>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <Small className="font-medium">Drill Names</Small>
                      <Small className="text-muted-foreground">
                        All drill names are imported as-is
                      </Small>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <Small className="font-medium">Duration (Minutes)</Small>
                      <Small className="text-muted-foreground">
                        Time estimates are preserved
                      </Small>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <Small className="font-medium">
                        Notes & Instructions
                      </Small>
                      <Small className="text-muted-foreground">
                        All drill notes are imported
                      </Small>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <Small className="font-medium">Media Links</Small>
                      <Small className="text-muted-foreground">
                        Video and image links are preserved
                      </Small>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Important Notes */}
            <AccordionItem value="important-notes">
              <AccordionTrigger className="text-left">
                <div>
                  <H3 id="important-notes">Important Notes</H3>
                  <P className="text-muted-foreground font-normal">
                    Things to keep in mind during migration
                  </P>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <Small className="font-medium mb-1">
                        Duplicate Handling
                      </Small>
                      <P className="text-muted-foreground">
                        If you import a drill with the same name as an existing
                        drill, the duplicate will be skipped automatically. You
                        can manually edit or delete drills after import if
                        needed.
                      </P>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <Small className="font-medium mb-1">
                        File Size Limits
                      </Small>
                      <P className="text-muted-foreground">
                        Maximum file size is 10MB. If your drill list is larger,
                        you may need to split it into multiple files or contact
                        support for assistance.
                      </P>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <Small className="font-medium mb-1">Other Systems</Small>
                      <P className="text-muted-foreground">
                        If you're migrating from a system other than
                        PracticePlannerLive, please use our XLS template for
                        manual import. Contact support if you need assistance.
                      </P>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* XLS Template Download */}
            <AccordionItem value="xls-template">
              <AccordionTrigger className="text-left">
                <div>
                  <H3 id="xls-template">XLS Template for Other Systems</H3>
                  <P className="text-muted-foreground font-normal">
                    Download a template to manually import drills from other
                    systems
                  </P>
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
