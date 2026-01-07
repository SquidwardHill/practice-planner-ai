"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { P, Small } from "@/components/atoms/typography";

export function XLSTemplateDownload() {
  const handleDownload = () => {
    // Create example drills data
    const exampleDrills = [
      {
        Category: "Warmup",
        Name: "3-Man Weave",
        Minutes: 5,
        Notes:
          "Players form three lines and weave around each other, passing the ball",
        "Media Links": "https://example.com/video1",
      },
      {
        Category: "Skill Development/Shooting",
        Name: "Form Shooting",
        Minutes: 10,
        Notes:
          "Focus on proper shooting form and follow-through. Start close to the basket and gradually move back.",
        "Media Links": "https://example.com/video2",
      },
      {
        Category: "Defense",
        Name: "Shell Defense",
        Minutes: 15,
        Notes:
          "Basic defensive positioning and rotations. Work on help defense and recovery.",
        "Media Links": "",
      },
      {
        Category: "Offense",
        Name: "5-Out Motion",
        Minutes: 20,
        Notes:
          "Spacing and ball movement in a 5-out offense. Emphasize player movement and ball reversals.",
        "Media Links": "https://example.com/video3",
      },
      {
        Category: "Conditioning",
        Name: "Full Court Layups",
        Minutes: 8,
        Notes: "Line drills for conditioning and finishing at the rim",
        "Media Links": "",
      },
    ];

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(exampleDrills);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Drills");

    // Write to file (XLS format)
    XLSX.writeFile(workbook, "drill-import-template.xls", {
      bookType: "xls",
      type: "binary",
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <P className="font-medium mb-2">XLS Template for Manual Import</P>
            <Small className="text-muted-foreground mb-4">
              If you're migrating from a system other than PracticePlannerLive,
              download our XLS template and fill it in with your drill data. The
              template includes 5 example drills to guide you.
            </Small>
            <Button onClick={handleDownload} variant="outline" size="default">
              <Download className="  h-4 w-4" />
              Download XLS Template
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <P className="font-medium">XLS Template Format:</P>
        <ul className="text-base text-muted-foreground list-disc list-inside space-y-1 ml-2">
          <li>
            <strong>Category</strong> (required) - The drill category (e.g.,
            "Warmup", "Skill Development/Shooting")
          </li>
          <li>
            <strong>Name</strong> (required) - The name of the drill
          </li>
          <li>
            <strong>Minutes</strong> (optional) - Estimated duration in minutes
          </li>
          <li>
            <strong>Notes</strong> (optional) - Drill description or
            instructions
          </li>
          <li>
            <strong>Media Links</strong> (optional) - URLs to videos or images
            (comma-separated for multiple links)
          </li>
        </ul>
      </div>

      <div className="rounded-lg border bg-muted/50 p-3">
        <Small className="text-muted-foreground">
          <strong>Note:</strong> The template includes 5 example drills. You can
          edit these or delete them and add your own. The template can be opened
          in Excel, Google Sheets, LibreOffice, or Numbers. After filling in
          your drills, save the file and upload it using the "Upload Drill List"
          button above.
        </Small>
      </div>
    </div>
  );
}
