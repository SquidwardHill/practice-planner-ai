/**
 * Cloudflare Worker: YouTube transcript proxy
 *
 * Endpoint:
 *   GET /transcript?videoId=<id>&url=<watchUrl>
 *
 * Response:
 *   { segments: [{ text, offset, duration }, ...] }
 *
 * Optional auth:
 *   - Set env var PROXY_TOKEN
 *   - Client sends header x-transcript-proxy-token
 */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname !== "/transcript") {
        return json({ error: "Not found" }, 404);
      }

      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405);
      }

      if (env.PROXY_TOKEN) {
        const incoming = request.headers.get("x-transcript-proxy-token") || "";
        if (incoming !== env.PROXY_TOKEN) {
          return json({ error: "Unauthorized" }, 401);
        }
      }

      const videoId = (url.searchParams.get("videoId") || "").trim();
      const watchUrl = (url.searchParams.get("url") || "").trim();
      if (!videoId || !watchUrl) {
        return json({ error: "videoId and url are required" }, 400);
      }

      // Primary: direct library path
      try {
        const segments = await fetchViaLibrary(videoId);
        if (segments.length > 0) return json({ segments }, 200);
      } catch (e) {
        console.warn("library transcript fetch failed", e);
      }

      // Secondary: page + caption xml path
      try {
        const segments = await fetchViaWatchPage(watchUrl);
        if (segments.length > 0) return json({ segments }, 200);
      } catch (e) {
        console.warn("watch page transcript fetch failed", e);
      }

      return json(
        {
          error:
            "Transcript unavailable from proxy methods (captions disabled/private/blocked).",
        },
        422,
      );
    } catch (error) {
      return json(
        {
          error: "Internal proxy error",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  },
};

async function fetchViaLibrary(videoId) {
  // Dynamic import keeps worker startup lean.
  const { YoutubeTranscript } = await import("youtube-transcript");
  const rows = await YoutubeTranscript.fetchTranscript(videoId);
  return rows.map((r) => ({
    text: String(r.text || "").trim(),
    offset: Number.isFinite(r.offset) ? Math.max(0, Math.floor(r.offset)) : 0,
    duration: Number.isFinite(r.duration)
      ? Math.max(0, Math.floor(r.duration))
      : 0,
  }));
}

async function fetchViaWatchPage(watchUrl) {
  const pageRes = await fetch(watchUrl, {
    method: "GET",
    headers: {
      "User-Agent": "pp-transcript-proxy/1.0",
      Accept: "text/html",
    },
  });
  if (!pageRes.ok) {
    throw new Error(`watch page fetch failed (${pageRes.status})`);
  }

  const html = await pageRes.text();
  const playerResponse = extractPlayerResponseJson(html);
  if (!playerResponse) {
    throw new Error("could not parse player response JSON");
  }

  const captionTracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
    throw new Error("no caption tracks found");
  }

  const selectedTrack =
    captionTracks.find((t) => t?.languageCode === "en" && t?.kind !== "asr") ||
    captionTracks.find((t) => t?.languageCode === "en") ||
    captionTracks[0];

  const baseUrl = selectedTrack?.baseUrl;
  if (!baseUrl) {
    throw new Error("caption track baseUrl missing");
  }

  const captionsRes = await fetch(baseUrl, {
    method: "GET",
    headers: {
      "User-Agent": "pp-transcript-proxy/1.0",
      Accept: "application/xml,text/xml,text/plain",
    },
  });
  if (!captionsRes.ok) {
    throw new Error(`caption XML fetch failed (${captionsRes.status})`);
  }

  const xml = await captionsRes.text();
  return parseCaptionXml(xml);
}

function extractPlayerResponseJson(html) {
  const token = "ytInitialPlayerResponse";
  const tokenIdx = html.indexOf(token);
  if (tokenIdx < 0) return null;

  const firstBraceIdx = html.indexOf("{", tokenIdx);
  if (firstBraceIdx < 0) return null;

  const jsonText = readBalancedJsonObject(html, firstBraceIdx);
  if (!jsonText) return null;

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function readBalancedJsonObject(input, startIdx) {
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
      if (depth === 0) return input.slice(startIdx, i + 1);
    }
  }
  return null;
}

function parseCaptionXml(xml) {
  const textNodes = xml.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g);
  const segments = [];

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

function decodeHtmlEntities(text) {
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

