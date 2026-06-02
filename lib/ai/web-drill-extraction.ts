import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { DrillImportRow } from "@/lib/types/drill";

/** Bump when prompt or schema changes so operators know cache semantics. */
export const WEB_DRILL_EXTRACTION_PROMPT_VERSION = "v1";

const drillsOutputSchema = z.object({
  drills: z.array(
    z.object({
      Category: z.string(),
      Name: z.string(),
      Minutes: z.union([z.number(), z.string()]).optional(),
      Notes: z.string().optional(),
      "Media Links": z.string().optional(),
    }),
  ),
});

export async function extractDrillsFromWebPageText(params: {
  pageTextForPrompt: string;
  pageUrl: string;
}): Promise<DrillImportRow[]> {
  const { pageTextForPrompt, pageUrl } = params;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: drillsOutputSchema,
    temperature: 0.4,
    system: `You are an expert basketball coach assistant. Your job is to read a scraped web page (non-transcript text) and extract structured drills for a practice drill library.

Rules:
- Output one row per distinct drill or activity that is clearly repeatable.
- If the page is mainly opinion, narration, or isn't about basketball drills, output an empty drills array.
- Category: use concise labels like Shooting, Ball Handling, Defense, Conditioning, Footwork, Team Offense, Rebounding, Warmup, etc.
- Name: short, unique titles suitable for a library list.
- Minutes: estimate duration if mentioned; otherwise omit or use a reasonable default like 5.
- Notes: key coaching cues, setup, and constraints from the page—do not invent details not supported by the page.
- "Media Links": set to the page URL provided by the user for every row by default.
- Do not fabricate drill names that are not grounded in the page.`,
    prompt: `Page URL (use for Media Links on each row):
${pageUrl}

--- Web Page Content ---
${pageTextForPrompt}`,
  });

  return object.drills.map((d) => ({
    Category: d.Category,
    Name: d.Name,
    Minutes: d.Minutes,
    Notes: d.Notes,
    "Media Links": (d["Media Links"]?.trim() || pageUrl) as string,
  }));
}

