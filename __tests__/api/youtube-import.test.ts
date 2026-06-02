import { NextRequest } from "next/server";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();
const mockEq2 = jest.fn();
const mockEq1 = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockUpsert = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    }),
  ),
}));

const mockFetchTranscript = jest.fn();
jest.mock("youtube-transcript", () => ({
  YoutubeTranscript: {
    fetchTranscript: (...args: unknown[]) => mockFetchTranscript(...args),
  },
}));

const mockExtract = jest.fn();
jest.mock("@/lib/ai/youtube-drill-extraction", () => ({
  extractDrillsFromTranscript: (...args: unknown[]) => mockExtract(...args),
  YOUTUBE_DRILL_EXTRACTION_PROMPT_VERSION: "v1",
}));

import { POST } from "@/app/api/drills/import/youtube/route";

function setupSupabaseChains() {
  mockFrom.mockImplementation((table: string) => {
    if (table === "youtube_import_cache") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
        upsert: mockUpsert,
      };
    }
    if (table === "drills") {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    }
    return {};
  });
}

describe("POST /api/drills/import/youtube", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: null });
    mockUpsert.mockResolvedValue({ error: null });
    mockFetchTranscript.mockResolvedValue([
      { text: "Warm up layups", offset: 0, duration: 2000 },
    ]);
    mockExtract.mockResolvedValue([
      {
        Category: "Warmup",
        Name: "Layup lines",
        Minutes: 5,
        Notes: "Full court",
        "Media Links": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ]);
    setupSupabaseChains();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("no session"),
    });

    const req = new NextRequest("http://localhost/api/drills/import/youtube", {
      method: "POST",
      body: JSON.stringify({ url: "https://youtu.be/dQw4w9WgXcQ" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when url is missing", async () => {
    const req = new NextRequest("http://localhost/api/drills/import/youtube", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when url is not YouTube", async () => {
    const req = new NextRequest("http://localhost/api/drills/import/youtube", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns success with rows when transcript and AI succeed", async () => {
    const req = new NextRequest("http://localhost/api/drills/import/youtube", {
      method: "POST",
      body: JSON.stringify({ url: "https://youtu.be/dQw4w9WgXcQ" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0].Name).toBe("Layup lines");
    expect(body.cached).toBe(false);
    expect(mockExtract).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalled();
  });
});
