import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { DrillImportRow } from "@/lib/types/drill";

/** Bump when prompt or schema changes so operators know cache semantics. */
export const YOUTUBE_DRILL_EXTRACTION_PROMPT_VERSION = "v1";

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

export async function extractDrillsFromTranscript(params: {
  transcriptForPrompt: string;
  watchUrl: string;
}): Promise<DrillImportRow[]> {
  const { transcriptForPrompt, watchUrl } = params;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: drillsOutputSchema,
    temperature: 0.4,
    system: `You are an expert basketball coach assistant. Your job is to read a YouTube video transcript (spoken coaching content) and extract structured drills for a practice drill library.

Rules:
- Output one row per distinct drill or segment that is clearly a repeatable practice activity. If the whole video is one continuous drill, output a single row.
- Category: use concise labels like Shooting, Ball Handling, Defense, Conditioning, Footwork, Team Offense, Rebounding, Warmup, etc.
- Name: short, unique titles suitable for a library list.
- Minutes: estimate duration if mentioned; otherwise omit or use a reasonable default like 5.
- Notes: key coaching cues, setup, and constraints from the transcript—do not invent details not supported by the transcript.
- Media Links: set to the exact watch URL provided in the user message for every row unless the transcript clearly refers to a different clip (rare); default is the provided watch URL for all rows.
- Do not fabricate drill names that are not grounded in the transcript.`,
    prompt: `Watch URL for this video (use for Media Links on each row unless you have strong transcript evidence for a different URL):\n${watchUrl}\n\n--- Transcript ---\n${transcriptForPrompt}`,
  });

  return object.drills.map((d) => ({
    Category: d.Category,
    Name: d.Name,
    Minutes: d.Minutes,
    Notes: d.Notes,
    "Media Links": (d["Media Links"]?.trim() || watchUrl) as string,
  }));
}
