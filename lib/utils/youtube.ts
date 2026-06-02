/**
 * YouTube URL helpers for smart import and media display.
 * Video IDs are 11-character base64url-style strings.
 */
const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extract 11-character YouTube video ID from common URL shapes:
 * watch (v= anywhere in query), youtu.be, embed, m.youtube, shorts.
 */
export function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (VIDEO_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && VIDEO_ID_PATTERN.test(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      const v = url.searchParams.get("v");
      if (v && VIDEO_ID_PATTERN.test(v)) return v;

      const pathParts = url.pathname.split("/").filter(Boolean);
      const embedIdx = pathParts.indexOf("embed");
      if (embedIdx >= 0 && pathParts[embedIdx + 1]) {
        const id = pathParts[embedIdx + 1];
        return VIDEO_ID_PATTERN.test(id) ? id : null;
      }
      const shortIdx = pathParts.indexOf("shorts");
      if (shortIdx >= 0 && pathParts[shortIdx + 1]) {
        const id = pathParts[shortIdx + 1];
        return VIDEO_ID_PATTERN.test(id) ? id : null;
      }
    }
  } catch {
    // fall through to regex
  }

  const watchMatch = trimmed.match(
    /(?:youtube\.com\/watch\?[^#]*[&?]v=|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|m\.youtube\.com\/watch\?[^#]*[&?]v=|m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  );
  if (watchMatch?.[1] && VIDEO_ID_PATTERN.test(watchMatch[1])) {
    return watchMatch[1];
  }

  return null;
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Max characters of joined caption text sent to the LLM.
 * Long transcripts are truncated at a paragraph/sentence boundary.
 */
export const MAX_TRANSCRIPT_CHARS_FOR_PROMPT = 100_000;

export function truncateTranscriptForPrompt(
  text: string,
  maxChars: number = MAX_TRANSCRIPT_CHARS_FOR_PROMPT,
): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastBreak = Math.max(
    slice.lastIndexOf("\n\n"),
    slice.lastIndexOf(". "),
  );
  if (lastBreak > maxChars * 0.65) {
    return `${slice.slice(0, lastBreak)}\n\n[Transcript truncated for processing.]`;
  }
  return `${slice}\n[Transcript truncated for processing.]`;
}
