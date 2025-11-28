import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";
import { generateMockPracticePlan } from "./mock-data";

// - Edge Runtime: 25s to start response, can stream for up to 300s total
export const runtime = "edge";

const DRILL_LIST = `You are an expert basketball coach. You have access to the following library of drills. When generating a plan, YOU MUST ONLY USE DRILLS FROM THIS LIST. Do not hallucinate new drills.

The Drill List:

1. 3-Man Weave (Warmup | 10 mins) - Full court passing drill to get heart rates up.
2. Dynamic Stretching (Warmup | 5 mins) - Baseline to baseline lunges, high knees, butt kicks.
3. Form Shooting (Shooting | 10 mins) - Close range shooting focusing on mechanics. One hand, then guide hand.
4. Shell Drill (Defense | 15 mins) - 4v4 half court. Focus on help-side positioning and defensive rotation.
5. Zig-Zag Slide (Defense/Conditioning | 10 mins) - Defensive slides lane-to-lane full court. Focus on turning hips.
6. 3v2 to 2v1 (Transition | 10 mins) - Fast break drill. Offense attacks 3v2, defense rebounds and goes 2v1 other way.
7. 11-Man Break (Transition | 15 mins) - Continuous full court layup drill. High intensity conditioning.
8. Box Out Gauntlet (Rebounding | 10 mins) - 1v1 in the paint. Defense must box out offense for 3 seconds.
9. Scrimmage (Half Court) (Live Play | 20 mins) - Controlled 5v5 half court with specific constraints.
10. Free Throws & Water (Rest | 5 mins) - Players shoot 2 free throws and get water.`;

const SYSTEM_PROMPT = `${DRILL_LIST}

When a user requests a practice plan, you must:
1. Only select drills from the list above
2. Organize them logically (warmup first, then main drills, then scrimmage/live play, then rest)
3. Calculate time slots starting from 0:00
4. Ensure the total duration matches the user's request
5. The time_slot should be formatted as "start_time - end_time" where times are in MM:SS format. Calculate each block's start time based on the previous block's end time.`;

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
      return new Response("Prompt is required", { status: 400 });
    }

    const useMock =
      !process.env.OPENAI_API_KEY || process.env.USE_MOCK_API === "true";

    if (useMock) {
      const mockPlan = generateMockPracticePlan(prompt);
      return Response.json(mockPlan);
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Starting streamObject generation with Edge Runtime...");

    try {
      const result = streamObject({
        model: openai("gpt-4o"),
        system: SYSTEM_PROMPT,
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
  } catch (error: any) {
    console.error("Error generating practice plan:", error);

    if (
      error?.name === "AI_APICallError" ||
      error?.data?.error?.code === "invalid_api_key"
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid OpenAI API key",
          details:
            "The OpenAI API key configured in Vercel is incorrect or expired. Please check your environment variables.",
          hint: "Go to Vercel Dashboard → Your Project → Settings → Environment Variables and verify OPENAI_API_KEY is set correctly.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Error generating practice plan",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
