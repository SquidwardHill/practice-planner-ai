"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { P, Small } from "@/components/atoms/typography";

export function XLSTemplateDownload() {
  const handleDownload = async () => {
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Drills");
    worksheet.columns = [
      { header: "Category", key: "Category", width: 28 },
      { header: "Name", key: "Name", width: 22 },
      { header: "Minutes", key: "Minutes", width: 10 },
      { header: "Notes", key: "Notes", width: 50 },
      { header: "Media Links", key: "Media Links", width: 24 },
    ];
    exampleDrills.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drill-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <P className="font-medium mb-2">Excel template for manual import</P>
            <Small className="text-muted-foreground mb-4">
              If you're migrating from a system other than PracticePlannerLive,
              download our Excel (.xlsx) template and fill it in with your drill
              data. The template includes 5 example drills to guide you.
            </Small>
            <Button onClick={handleDownload} variant="outline" size="default">
              <Download className="  h-4 w-4" />
              Download Excel template
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <P className="font-medium">Excel template format:</P>
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
          edit these or delete them and add your own. Open the file in Excel,
          Google Sheets, LibreOffice, or Numbers. After filling in your drills,
          save as .xlsx and upload using the "Upload Drill List" button above.
        </Small>
      </div>
    </div>
  );
}
