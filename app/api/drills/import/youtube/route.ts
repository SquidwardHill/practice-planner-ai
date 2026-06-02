import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { createClient } from "@/lib/supabase/server";
import { extractDrillsFromTranscript, YOUTUBE_DRILL_EXTRACTION_PROMPT_VERSION } from "@/lib/ai/youtube-drill-extraction";
import { truncateTranscriptForPrompt } from "@/lib/utils/youtube";
import {
  normalizeDrillRow,
  validateDrillRow,
} from "@/lib/utils/drill-parser";
import { buildYouTubeWatchUrl, parseYouTubeVideoId } from "@/lib/utils/youtube";
import type { DrillImportRow } from "@/lib/types/drill";

/**
 * POST /api/drills/import/youtube
 * Fetches captions, extracts drills with AI, caches by user + video + transcript hash.
 * YouTube caption APIs may be flaky from cloud IPs — see transcript fetch error handling.
 *
 * Not Edge: uses youtube-transcript and Node crypto.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      url?: string;
      forceRefresh?: boolean;
    };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const forceRefresh = Boolean(body.forceRefresh);

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 },
      );
    }

    const videoId = parseYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not parse a YouTube video ID from that URL." },
        { status: 400 },
      );
    }

    const watchUrl = buildYouTubeWatchUrl(videoId);

    let segments: { text: string; offset: number; duration: number }[];
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (e) {
      console.error("YouTube transcript fetch failed:", e);
      const message =
        e instanceof Error ? e.message : "Transcript could not be fetched.";
      return NextResponse.json(
        {
          error: "Transcript unavailable",
          message: `${message} This can happen if captions are disabled, the video is private, or YouTube is blocking automated requests.`,
        },
        { status: 422 },
      );
    }

    if (!segments?.length) {
      return NextResponse.json(
        {
          error: "Transcript unavailable",
          message: "No caption segments were returned for this video.",
        },
        { status: 422 },
      );
    }

    const fullTranscript = segments
      .map((s) => {
        const sec = Math.floor(s.offset / 1000);
        const mm = String(Math.floor(sec / 60)).padStart(2, "0");
        const ss = String(sec % 60).padStart(2, "0");
        return `[${mm}:${ss}] ${s.text}`;
      })
      .join("\n");

    const transcriptHash = createHash("sha256")
      .update(fullTranscript, "utf8")
      .digest("hex");

    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("youtube_import_cache")
        .select("transcript_hash, rows")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();

      if (
        cached?.transcript_hash === transcriptHash &&
        Array.isArray(cached.rows) &&
        cached.rows.length > 0
      ) {
        const rawRows = cached.rows as DrillImportRow[];
        return NextResponse.json(
          await buildImportResponse(supabase, user.id, rawRows, {
            cached: true,
            videoUrl: watchUrl,
            promptVersion: YOUTUBE_DRILL_EXTRACTION_PROMPT_VERSION,
          }),
        );
      }
    }

    const transcriptForPrompt = truncateTranscriptForPrompt(fullTranscript);
    if (transcriptForPrompt.length < fullTranscript.length) {
      console.warn(
        `[youtube import] Transcript truncated for video ${videoId}: ${fullTranscript.length} -> ${transcriptForPrompt.length} chars`,
      );
    }

    let aiRows: DrillImportRow[];
    try {
      aiRows = await extractDrillsFromTranscript({
        transcriptForPrompt,
        watchUrl,
      });
    } catch (e) {
      console.error("AI drill extraction failed:", e);
      return NextResponse.json(
        {
          error: "AI extraction failed",
          message: e instanceof Error ? e.message : "Unknown error",
        },
        { status: 500 },
      );
    }

    if (!aiRows.length) {
      return NextResponse.json(
        {
          error: "No drills extracted",
          message:
            "The model did not return any drills from this transcript. Try a different video or edit manually after import.",
        },
        { status: 422 },
      );
    }

    const rowsToCache: DrillImportRow[] = [];
    const validationErrors: Array<{ row: number; error: string }> = [];

    aiRows.forEach((row, index) => {
      const normalized = normalizeDrillRow(row);
      const validation = validateDrillRow(normalized, index);
      if (validation.valid) {
        rowsToCache.push(normalized);
      } else {
        validationErrors.push({
          row: index + 1,
          error: validation.error || "Validation error",
        });
      }
    });

    if (rowsToCache.length === 0) {
      return NextResponse.json(
        {
          error: "No valid drills",
          message: "Extracted rows failed validation.",
          summary: {
            totalRows: aiRows.length,
            validRows: 0,
            invalidRows: validationErrors.length,
            errors: validationErrors,
          },
        },
        { status: 422 },
      );
    }

    const { error: upsertError } = await supabase
      .from("youtube_import_cache")
      .upsert(
        {
          user_id: user.id,
          video_id: videoId,
          transcript_hash: transcriptHash,
          rows: rowsToCache,
        },
        { onConflict: "user_id,video_id" },
      );

    if (upsertError) {
      console.error("youtube_import_cache upsert:", upsertError);
    }

    return NextResponse.json(
      await buildImportResponse(supabase, user.id, rowsToCache, {
        cached: false,
        videoUrl: watchUrl,
        promptVersion: YOUTUBE_DRILL_EXTRACTION_PROMPT_VERSION,
        priorErrors: validationErrors,
        totalRows: aiRows.length,
      }),
    );
  } catch (error) {
    console.error("YouTube import error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

async function buildImportResponse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  validatedRows: DrillImportRow[],
  meta: {
    cached: boolean;
    videoUrl: string;
    promptVersion: string;
    priorErrors?: Array<{ row: number; error: string }>;
    totalRows?: number;
  },
) {
  const { data: existingDrills } = await supabase
    .from("drills")
    .select("name")
    .eq("user_id", userId);

  const existingNames = new Set(
    (existingDrills || []).map((d) => d.name.toLowerCase()),
  );

  const duplicateErrors: Array<{ row: number; error: string }> = [];
  const uniqueRows: DrillImportRow[] = [];

  validatedRows.forEach((row, validatedPosition) => {
    const nameLower = row.Name?.toLowerCase();

    if (nameLower && existingNames.has(nameLower)) {
      duplicateErrors.push({
        row: validatedPosition + 1,
        error: `Duplicate drill name: "${row.Name}" already exists in your library`,
      });
    } else {
      uniqueRows.push(row);
      if (nameLower) {
        existingNames.add(nameLower);
      }
    }
  });

  const priorErrors = meta.priorErrors ?? [];
  const allErrors = [...priorErrors, ...duplicateErrors];
  const totalRows = meta.totalRows ?? validatedRows.length;

  return {
    success: true,
    rows: uniqueRows,
    summary: {
      totalRows,
      validRows: uniqueRows.length,
      invalidRows: allErrors.length,
      errors: allErrors,
    },
    cached: meta.cached,
    videoUrl: meta.videoUrl,
    promptVersion: meta.promptVersion,
  };
}
