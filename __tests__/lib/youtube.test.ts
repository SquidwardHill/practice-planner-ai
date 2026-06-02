import {
  buildYouTubeWatchUrl,
  MAX_TRANSCRIPT_CHARS_FOR_PROMPT,
  parseYouTubeVideoId,
  truncateTranscriptForPrompt,
} from "@/lib/utils/youtube";

describe("parseYouTubeVideoId", () => {
  it("parses bare 11-char video id", () => {
    expect(parseYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses watch URL with v= first in query", () => {
    expect(
      parseYouTubeVideoId(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses watch URL with v= after other params", () => {
    expect(
      parseYouTubeVideoId(
        "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses youtu.be short links", () => {
    expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("parses embed URL", () => {
    expect(
      parseYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses m.youtube watch", () => {
    expect(
      parseYouTubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses shorts path", () => {
    expect(
      parseYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URLs", () => {
    expect(parseYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toBe(
      null,
    );
  });

  it("returns null for empty input", () => {
    expect(parseYouTubeVideoId("")).toBe(null);
    expect(parseYouTubeVideoId("   ")).toBe(null);
  });
});

describe("buildYouTubeWatchUrl", () => {
  it("builds canonical watch URL", () => {
    expect(buildYouTubeWatchUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });
});

describe("truncateTranscriptForPrompt", () => {
  it("returns short text unchanged", () => {
    const t = "Hello world.";
    expect(truncateTranscriptForPrompt(t, 100)).toBe(t);
  });

  it("truncates long text under max and adds notice", () => {
    const long = "x".repeat(MAX_TRANSCRIPT_CHARS_FOR_PROMPT + 5000);
    const out = truncateTranscriptForPrompt(
      long,
      MAX_TRANSCRIPT_CHARS_FOR_PROMPT,
    );
    expect(out.length).toBeLessThanOrEqual(long.length);
    expect(out).toContain("truncated");
  });
});
