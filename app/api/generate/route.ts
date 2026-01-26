import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type Drill } from "@/lib/types/drill";

// - Edge Runtime: 25s to start response, can stream for up to 300s total
export const runtime = "edge";

function formatDrillList(drills: Drill[]): string {
  if (drills.length === 0) {
    return "No drills available in the library.";
  }

  return drills
    .map((drill, index) => {
      const minutes = drill.minutes ? ` | ${drill.minutes} mins` : "";
      const notes = drill.notes ? ` - ${drill.notes}` : "";
      return `${index + 1}. ${drill.name} (${drill.category}${minutes})${notes}`;
    })
    .join("\n");
}

function buildSystemPrompt(drillList: string): string {
  return `You are an expert basketball coach. You have access to the following library of drills. When generating a practice plan, YOU MUST ONLY USE DRILLS FROM THIS LIST. Do not hallucinate new drills.

The Drill List:

${drillList}

When a user requests a practice plan, you must:
1. Only select drills from the list above
2. Organize them logically (warmup first, then main drills, then scrimmage/live play, then rest)
3. Calculate time slots starting from 0:00
4. Ensure the total duration matches the user's request
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

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's drills from database
    const { data: drills, error: drillsError } = await supabase
      .from("drills")
      .select("*")
      .eq("user_id", user.id)
      .order("category", { ascending: true })
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
          message: "Please add drills to your library before generating a practice plan.",
        },
        { status: 400 }
      );
    }

    // Format drills for AI prompt
    const drillList = formatDrillList(drills);
    const systemPrompt = buildSystemPrompt(drillList);

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    console.log(`Starting streamObject generation with ${drills.length} drills from user library...`);

    try {
      const result = streamObject({
        model: openai("gpt-4o"),
        system: systemPrompt,
        prompt: `Generate a basketball practice plan based on this request: ${prompt}`,
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

    const err = error as { name?: string; data?: { error?: { code?: string } } };
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
