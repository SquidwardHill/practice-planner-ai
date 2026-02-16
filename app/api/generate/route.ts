import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type Drill } from "@/lib/types/drill";

// - Edge Runtime: 25s to start response, can stream for up to 300s total
export const runtime = "edge";

function formatDrillList(
  drills: Array<Drill & { categories?: { name: string } | null }>
): string {
  if (drills.length === 0) {
    return "No drills available in the library.";
  }

  return drills
    .map((drill, index) => {
      const categoryName = drill.categories?.name ?? "—";
      const minutes = drill.minutes ? ` | ${drill.minutes} mins` : "";
      const notes = drill.notes ? ` - ${drill.notes}` : "";
      return `${index + 1}. ${drill.name} (${categoryName}${minutes})${notes}`;
    })
    .join("\n");
}

/**
 * Extract requested duration in minutes from the user's prompt.
 * Matches patterns like "30 minute", "30 min", "90 minutes", "1.5 hour", "1 hour".
 * Returns null if no duration is found.
 */
function extractRequestedDurationMinutes(prompt: string): number | null {
  const normalized = prompt.toLowerCase().trim();
  // e.g. "30 minute", "30 minutes", "30 min"
  const minMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:minute|minutes|min)\b/
  );
  if (minMatch) {
    const n = parseFloat(minMatch[1]);
    return n > 0 && n <= 300 ? Math.round(n) : null;
  }
  // e.g. "1 hour", "1.5 hours"
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hr)\b/);
  if (hourMatch) {
    const n = parseFloat(hourMatch[1]);
    return n > 0 && n <= 5 ? Math.round(n * 60) : null;
  }
  return null;
}

function buildSystemPrompt(drillList: string): string {
  return `You are an expert basketball coach. You have access to the following library of drills. When generating a practice plan, YOU MUST ONLY USE DRILLS FROM THIS LIST. Do not hallucinate new drills.

The Drill List:

${drillList}

When a user requests a practice plan, you must:
1. Only select drills from the list above
2. Organize them logically (warmup first, then main drills, then scrimmage/live play, then rest)
3. Calculate time slots starting from 0:00
4. CRITICAL: The total duration MUST match the user's request exactly. If they ask for 30 minutes, the plan must be 30 minutes—the sum of all block durations must equal that number. total_duration_minutes in your response must equal that number. Do not exceed or fall short.
5. The time_slot should be formatted as "start_time - end_time" where times are in MM:SS format. Calculate each block's start time based on the previous block's end time.
6. Use the exact drill names and categories from the list above`;
}

const practicePlanSchema = z.object({
  practice_title: z.string(),
  total_duration_minutes: z.number(),
  blocks: z.array(
    z.object({
      time_slot: z.string(),
      drill_name: z.string(),
      category: z.string(),
      duration: z.number(),
      notes: z.string(),
    })
  ),
});

function formatExistingPlanForPrompt(plan: {
  practice_title: string;
  total_duration_minutes: number;
  blocks: Array<{
    time_slot: string;
    drill_name: string;
    category: string;
    duration: number;
    notes?: string;
  }>;
}): string {
  const blocksText = plan.blocks
    .map(
      (b) =>
        `- ${b.time_slot} | ${b.drill_name} (${b.category}) ${b.duration} min${b.notes ? ` — ${b.notes}` : ""}`
    )
    .join("\n");
  return `Title: ${plan.practice_title}\nTotal: ${plan.total_duration_minutes} minutes\n\nBlocks:\n${blocksText}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, existingPlan } = body as {
      prompt?: string;
      existingPlan?: {
        practice_title: string;
        total_duration_minutes: number;
        blocks: Array<{
          time_slot: string;
          drill_name: string;
          category: string;
          duration: number;
          notes?: string;
        }>;
      };
    };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Authenticate user and fetch their drills
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's drills with category name
    const { data: drills, error: drillsError } = await supabase
      .from("drills")
      .select("*, categories(id, name)")
      .eq("user_id", user.id)
      .order("category_id", { ascending: true })
      .order("name", { ascending: true });

    if (drillsError) {
      console.error("Error fetching drills:", drillsError);
      return NextResponse.json(
        {
          error: "Failed to fetch drills",
          details: drillsError.message,
        },
        { status: 500 }
      );
    }

    if (!drills || drills.length === 0) {
      return NextResponse.json(
        {
          error: "No drills found",
          message:
            "Please add drills to your library before generating a practice plan.",
        },
        { status: 400 }
      );
    }

    // Format drills for AI prompt
    const drillList = formatDrillList(drills);
    const systemPrompt = buildSystemPrompt(drillList);

    const requestedMinutes = extractRequestedDurationMinutes(prompt);
    const durationInstruction =
      requestedMinutes != null
        ? ` CRITICAL: The user asked for a ${requestedMinutes}-minute plan. You MUST create a plan where the sum of all block durations equals exactly ${requestedMinutes} minutes, and total_duration_minutes must be ${requestedMinutes}. Do not use more or fewer minutes.`
        : "";

    const existingPlanContext =
      existingPlan &&
      existingPlan.practice_title &&
      Array.isArray(existingPlan.blocks) &&
      existingPlan.blocks.length > 0
        ? `\n\nThe user is editing an existing plan. Here is the current plan they want to modify or build on:\n\n${formatExistingPlanForPrompt(existingPlan)}\n\nApply the user's request to this plan (e.g. add a section, remove something, change duration, reorder). You MUST still only use drills from the library list above. Return the complete modified plan.`
        : "";

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    console.log(
      `Starting streamObject generation with ${
        drills.length
      } drills from user library${
        requestedMinutes != null ? ` (requested ${requestedMinutes} min)` : ""
      }...`
    );

    try {
      const result = streamObject({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: `Generate a basketball practice plan based on this request: ${prompt}.${durationInstruction}${existingPlanContext}`,
        schema: practicePlanSchema,
        temperature: 0.7,
      });

      console.log("StreamObject created, returning stream response...");
      const response = result.toTextStreamResponse();
      console.log("Stream response created successfully");
      return response;
    } catch (streamError) {
      console.error("Error in streamObject:", streamError);
      throw streamError;
    }
  } catch (error: unknown) {
    console.error("Error generating practice plan:", error);

    const err = error as {
      name?: string;
      data?: { error?: { code?: string } };
    };
    if (
      err?.name === "AI_APICallError" ||
      err?.data?.error?.code === "invalid_api_key"
    ) {
      return NextResponse.json(
        {
          error: "Invalid OpenAI API key",
          details:
            "The OpenAI API key configured in Vercel is incorrect or expired. Please check your environment variables.",
          hint: "Go to Vercel Dashboard → Your Project → Settings → Environment Variables and verify OPENAI_API_KEY is set correctly.",
        },
        { status: 401 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Error generating practice plan",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
