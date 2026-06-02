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
      segments = await fetchTranscriptWithFallback(videoId, watchUrl);
    } catch (e) {
      console.error("YouTube transcript fetch failed:", e);
      const message =
        e instanceof Error ? e.message : "Transcript could not be fetched.";
      return NextResponse.json(
        {
          error: "Transcript unavailable",
          message: `${message} This can happen if captions are disabled, the video is private, or YouTube is blocking cloud automated requests (common on serverless hosts).`,
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

type TranscriptSegment = { text: string; offset: number; duration: number };
const TRANSCRIPT_PROXY_TIMEOUT_MS = 12_000;

async function fetchTranscriptWithFallback(
  videoId: string,
  watchUrl: string,
): Promise<TranscriptSegment[]> {
  try {
    return await YoutubeTranscript.fetchTranscript(videoId);
  } catch (primaryError) {
    console.warn(
      `[youtube import] Primary transcript fetch failed for ${videoId}; trying fallback parser.`,
      primaryError,
    );
  }

  try {
    // Fallback approach:
    // 1) Load watch page HTML
    // 2) Read player response captions track metadata
    // 3) Fetch caption XML directly from track baseUrl
    const pageRes = await fetch(watchUrl, {
      method: "GET",
      headers: {
        "User-Agent": "practice-planner-ai/1.0",
        Accept: "text/html",
      },
      cache: "no-store",
    });

    if (!pageRes.ok) {
      throw new Error(`Fallback watch page fetch failed (${pageRes.status}).`);
    }

    const html = await pageRes.text();
    const playerResponse = extractPlayerResponseJson(html);
    if (!playerResponse) {
      throw new Error("Fallback parser could not read YouTube player response.");
    }

    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error("No caption tracks available for this video.");
    }

    const selectedTrack =
      captionTracks.find(
        (t) => t?.languageCode === "en" && t?.kind !== "asr",
      ) ||
      captionTracks.find((t) => t?.languageCode === "en") ||
      captionTracks[0];

    const baseUrl = selectedTrack?.baseUrl;
    if (typeof baseUrl !== "string" || !baseUrl) {
      throw new Error("Caption track URL missing from player response.");
    }

    const captionsRes = await fetch(baseUrl, {
      method: "GET",
      headers: {
        "User-Agent": "practice-planner-ai/1.0",
        Accept: "application/xml,text/xml,text/plain",
      },
      cache: "no-store",
    });
    if (!captionsRes.ok) {
      throw new Error(`Caption track fetch failed (${captionsRes.status}).`);
    }

    const captionsXml = await captionsRes.text();
    const parsed = parseCaptionXml(captionsXml);
    if (!parsed.length) {
      throw new Error("Fallback parser received an empty caption track.");
    }

    return parsed;
  } catch (fallbackError) {
    console.warn(
      `[youtube import] Secondary transcript fallback failed for ${videoId}; trying proxy fallback if configured.`,
      fallbackError,
    );
  }

  const proxySegments = await fetchTranscriptViaProxy(videoId, watchUrl);
  if (proxySegments?.length) {
    return proxySegments;
  }

  throw new Error(
    "Transcript could not be fetched from YouTube directly. Configure TRANSCRIPT_PROXY_URL for additional fallback.",
  );
}

async function fetchTranscriptViaProxy(
  videoId: string,
  watchUrl: string,
): Promise<TranscriptSegment[] | null> {
  const proxyBase = process.env.TRANSCRIPT_PROXY_URL?.trim();
  if (!proxyBase) return null;

  let endpoint: URL;
  try {
    endpoint = new URL(proxyBase);
  } catch {
    console.error("Invalid TRANSCRIPT_PROXY_URL value:", proxyBase);
    return null;
  }

  endpoint.searchParams.set("videoId", videoId);
  endpoint.searchParams.set("url", watchUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSCRIPT_PROXY_TIMEOUT_MS);
  try {
    const proxyToken = process.env.TRANSCRIPT_PROXY_TOKEN?.trim();
    const res = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json,text/plain",
        ...(proxyToken
          ? { "x-transcript-proxy-token": proxyToken }
          : {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(
        `[youtube import] Proxy transcript request failed (${res.status}).`,
      );
      return null;
    }

    const data = (await res.json()) as
      | { segments?: unknown[]; transcript?: string }
      | null;

    if (!data) return null;

    if (Array.isArray(data.segments)) {
      const mapped = data.segments
        .map((s) => coerceTranscriptSegment(s))
        .filter((s): s is TranscriptSegment => Boolean(s));
      return mapped.length ? mapped : null;
    }

    if (typeof data.transcript === "string" && data.transcript.trim()) {
      return textTranscriptToSegments(data.transcript);
    }
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[youtube import] Proxy transcript request error:", msg);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function coerceTranscriptSegment(input: unknown): TranscriptSegment | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  const text = typeof obj.text === "string" ? obj.text.trim() : "";
  if (!text) return null;

  const offsetCandidate = obj.offset ?? obj.startMs ?? obj.start;
  const durationCandidate = obj.duration ?? obj.durationMs ?? obj.dur;

  const offset =
    typeof offsetCandidate === "number"
      ? offsetCandidate
      : Number.parseFloat(String(offsetCandidate ?? "0"));
  const duration =
    typeof durationCandidate === "number"
      ? durationCandidate
      : Number.parseFloat(String(durationCandidate ?? "0"));

  return {
    text,
    offset: Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0,
    duration: Number.isFinite(duration) ? Math.max(0, Math.floor(duration)) : 0,
  };
}

function textTranscriptToSegments(transcript: string): TranscriptSegment[] {
  const lines = transcript
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((line, idx) => ({
    text: line,
    offset: idx * 5_000,
    duration: 5_000,
  }));
}

type CaptionTrack = {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
};

type PlayerResponseLike = {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
};

function extractPlayerResponseJson(html: string): PlayerResponseLike | null {
  // Most watch pages include:
  // ytInitialPlayerResponse = {...};
  const token = "ytInitialPlayerResponse";
  const tokenIdx = html.indexOf(token);
  if (tokenIdx < 0) return null;

  const firstBraceIdx = html.indexOf("{", tokenIdx);
  if (firstBraceIdx < 0) return null;

  const jsonText = readBalancedJsonObject(html, firstBraceIdx);
  if (!jsonText) return null;

  try {
    return JSON.parse(jsonText) as PlayerResponseLike;
  } catch {
    return null;
  }
}

function readBalancedJsonObject(input: string, startIdx: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return input.slice(startIdx, i + 1);
      }
    }
  }
  return null;
}

function parseCaptionXml(xml: string): TranscriptSegment[] {
  const textNodes = xml.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g);
  const segments: TranscriptSegment[] = [];

  for (const match of textNodes) {
    const attrs = match[1] || "";
    const rawText = match[2] || "";
    const startMatch = attrs.match(/\bstart="([^"]+)"/);
    const durMatch = attrs.match(/\bdur="([^"]+)"/);

    const startSec = startMatch ? Number.parseFloat(startMatch[1]) : NaN;
    const durSec = durMatch ? Number.parseFloat(durMatch[1]) : 0;
    if (!Number.isFinite(startSec)) continue;

    const text = decodeHtmlEntities(rawText)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;

    segments.push({
      text,
      offset: Math.max(0, Math.floor(startSec * 1000)),
      duration: Math.max(0, Math.floor(durSec * 1000)),
    });
  }

  return segments;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const n = Number.parseInt(dec, 10);
      return Number.isFinite(n) ? String.fromCharCode(n) : _;
    });
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
