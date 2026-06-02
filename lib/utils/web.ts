import { createHash } from "crypto";
import * as dns from "dns";
import net from "net";
import * as cheerio from "cheerio";

const DEFAULT_FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "practice-planner-ai/1.0 (import; +https://practice-planner.ai)";

// Keep consistent with the YouTube truncation logic, so prompt behavior feels familiar.
export const MAX_WEB_TEXT_CHARS_FOR_PROMPT = 100_000;

function isPrivateIp(ip: string): boolean {
  // IPv4
  if (net.isIP(ip) === 4) {
    if (ip.startsWith("10.")) return true;
    if (ip.startsWith("172.")) {
      const second = parseInt(ip.split(".")[1] ?? "0", 10);
      return second >= 16 && second <= 31;
    }
    if (ip.startsWith("192.168.")) return true;
    if (ip.startsWith("127.")) return true;
    if (ip.startsWith("169.254.")) return true;
    if (ip.startsWith("0.")) return true;
    return false;
  }

  // IPv6 (best-effort v1)
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower === "::") return true;
  return false;
}

async function resolveHostToIp(hostname: string): Promise<string | null> {
  // If it's already an IP literal, don't resolve.
  if (net.isIP(hostname)) {
    return hostname;
  }

  // DNS lookup can hang; hard-timeout it.
  const lookupPromise = dns.promises.lookup(hostname, { all: false });
  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 2_000),
  );

  const res = await Promise.race([lookupPromise, timeoutPromise]);
  if (!res) return null;

  // Node can return string or object depending on lookup options.
  if (typeof res === "string") return res;
  if (
    typeof res === "object" &&
    res !== null &&
    "address" in res &&
    typeof res.address === "string"
  ) {
    return res.address;
  }
  return null;
}

export async function validateWebImportUrl(
  input: string,
): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const hostname = url.hostname.toLowerCase();

  // Basic SSRF guardrails (v1): block localhost-ish and private ranges.
  if (hostname === "localhost" || hostname.endsWith(".local")) return null;

  const resolvedIp = await resolveHostToIp(hostname);
  if (resolvedIp && isPrivateIp(resolvedIp)) return null;

  return url.toString();
}

export function normalizeUrlForCache(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";

  // Normalize trailing slash to avoid trivial cache misses.
  if (parsed.pathname && !parsed.pathname.endsWith("/")) {
    parsed.pathname = `${parsed.pathname}/`;
  }

  return parsed.toString();
}

export async function fetchPageHtml(
  url: string,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTextWhitespace(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function extractMainTextFromHtml(html: string): string {
  const cleanedHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  const pickTagInner = (tag: string): string => {
    const match = cleanedHtml.match(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
    );
    return match?.[1] ?? "";
  };

  const preferredContentHtml =
    pickTagInner("article") || pickTagInner("main") || cleanedHtml;

  try {
    const $ = cheerio.load(preferredContentHtml);

    // Remove likely non-content elements.
    $("script, style, noscript, svg, iframe, img").remove();
    $(
      "header, footer, nav, form, textarea, button, select, option, aside",
    ).remove();

    const blocks = $("body")
      .find("h1, h2, h3, p, li")
      .toArray()
      .map((el) => $(el).text())
      .map((t) => normalizeTextWhitespace(t))
      .filter((t) => t.length > 0);

    // Prefer structured extraction whenever we have any meaningful blocks.
    const joined = blocks.join("\n");
    if (joined.length > 0) return joined;

    const bodyText = $("body").text();
    return normalizeTextWhitespace(bodyText);
  } catch {
    // Regex fallback: best-effort extraction for environments where Cheerio can't load.
    const pieces: string[] = [];
    const tagRe = /<(h1|h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(preferredContentHtml))) {
      const inner = m[2].replace(/<[^>]+>/g, " ");
      const normalized = normalizeTextWhitespace(inner);
      if (normalized.length > 0) pieces.push(normalized);
    }

    const joined = pieces.join("\n");
    if (joined.length > 0) return joined;

    const bodyText = cleanedHtml.replace(/<[^>]+>/g, " ");
    return normalizeTextWhitespace(bodyText);
  }
}

export function truncateTextForPrompt(
  text: string,
  maxChars: number = MAX_WEB_TEXT_CHARS_FOR_PROMPT,
): string {
  if (text.length <= maxChars) return text;

  const slice = text.slice(0, maxChars);
  const lastBreak = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));

  if (lastBreak > maxChars * 0.65) {
    return `${slice.slice(0, lastBreak)}\n\n[Web content truncated for processing.]`;
  }
  return `${slice}\n[Web content truncated for processing.]`;
}

// Convenience for callers that want a hash of normalized text.
export function hashText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

