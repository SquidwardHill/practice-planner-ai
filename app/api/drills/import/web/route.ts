import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractDrillsFromWebPageText,
  WEB_DRILL_EXTRACTION_PROMPT_VERSION,
} from "@/lib/ai/web-drill-extraction";
import {
  extractMainTextFromHtml,
  fetchPageHtml,
  normalizeUrlForCache,
  truncateTextForPrompt,
  validateWebImportUrl,
} from "@/lib/utils/web";
import {
  normalizeDrillRow,
  validateDrillRow,
} from "@/lib/utils/drill-parser";
import type { DrillImportRow } from "@/lib/types/drill";

export const runtime = "nodejs";

type BuildImportResponseMeta = {
  cached: boolean;
  videoUrl: string;
  promptVersion: string;
  priorErrors?: Array<{ row: number; error: string }>;
  totalRows?: number;
};

/**
 * POST /api/drills/import/web
 * Fetches HTML from an arbitrary URL, extracts main readable text,
 * uses AI to suggest drill rows, validates/normalizes, and caches by
 * user + url + content hash.
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

    const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
    const forceRefresh = Boolean(body.forceRefresh);

    if (!rawUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const validatedUrl = await validateWebImportUrl(rawUrl);
    if (!validatedUrl) {
      return NextResponse.json(
        { error: "Could not parse a valid URL." },
        { status: 400 },
      );
    }

    const normalizedUrl = normalizeUrlForCache(validatedUrl);

    let html: string;
    try {
      html = await fetchPageHtml(normalizedUrl);
    } catch (e) {
      console.error("Web page fetch failed:", e);
      const message = e instanceof Error ? e.message : "Page could not be fetched.";
      return NextResponse.json(
        {
          error: "Page unavailable",
          message,
        },
        { status: 422 },
      );
    }

    const extractedText = extractMainTextFromHtml(html);
    const extractedTextNormalizedForHash = extractedText
      .replace(/\s+/g, " ")
      .trim();

    if (!extractedTextNormalizedForHash || extractedTextNormalizedForHash.length < 200) {
      return NextResponse.json(
        {
          error: "Page content unavailable",
          message:
            "PP couldn't extract enough readable text from this page. Try a different URL.",
        },
        { status: 422 },
      );
    }

    const contentHash = createHash("sha256")
      .update(extractedTextNormalizedForHash, "utf8")
      .digest("hex");

    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("web_import_cache")
        .select("content_hash, rows")
        .eq("user_id", user.id)
        .eq("url", normalizedUrl)
        .maybeSingle();

      if (
        cached?.content_hash === contentHash &&
        Array.isArray(cached.rows) &&
        cached.rows.length > 0
      ) {
        const rawRows = cached.rows as DrillImportRow[];
        return NextResponse.json(
          await buildImportResponse(supabase, user.id, rawRows, {
            cached: true,
            videoUrl: normalizedUrl,
            promptVersion: WEB_DRILL_EXTRACTION_PROMPT_VERSION,
          }),
        );
      }
    }

    const pageTextForPrompt = truncateTextForPrompt(extractedTextNormalizedForHash);
    if (pageTextForPrompt.length < extractedTextNormalizedForHash.length) {
      console.warn(
        `[web import] Page text truncated: ${extractedTextNormalizedForHash.length} -> ${pageTextForPrompt.length} chars`,
      );
    }

    let aiRows: DrillImportRow[];
    try {
      aiRows = await extractDrillsFromWebPageText({
        pageTextForPrompt,
        pageUrl: normalizedUrl,
      });
    } catch (e) {
      console.error("AI web drill extraction failed:", e);
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
            "The model did not return any drills from this page. Try a different URL or edit manually after import.",
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
      .from("web_import_cache")
      .upsert(
        {
          user_id: user.id,
          url: normalizedUrl,
          content_hash: contentHash,
          rows: rowsToCache,
        },
        { onConflict: "user_id,url" },
      );

    if (upsertError) {
      console.error("web_import_cache upsert:", upsertError);
    }

    return NextResponse.json(
      await buildImportResponse(supabase, user.id, rowsToCache, {
        cached: false,
        videoUrl: normalizedUrl,
        promptVersion: WEB_DRILL_EXTRACTION_PROMPT_VERSION,
        priorErrors: validationErrors,
        totalRows: aiRows.length,
      }),
    );
  } catch (error) {
    console.error("Web import error:", error);
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
  meta: BuildImportResponseMeta,
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
      if (nameLower) existingNames.add(nameLower);
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

