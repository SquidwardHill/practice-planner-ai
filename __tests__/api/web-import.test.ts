import { NextRequest } from "next/server";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();
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

const mockFetchPageHtml = jest.fn();
const mockExtractMainText = jest.fn();
const mockTruncateTextForPrompt = jest.fn();
const mockValidateUrl = jest.fn();
const mockNormalizeUrlForCache = jest.fn();

jest.mock("@/lib/utils/web", () => ({
  validateWebImportUrl: (...args: unknown[]) => mockValidateUrl(...args),
  normalizeUrlForCache: (...args: unknown[]) =>
    mockNormalizeUrlForCache(...args),
  fetchPageHtml: (...args: unknown[]) => mockFetchPageHtml(...args),
  extractMainTextFromHtml: (...args: unknown[]) =>
    mockExtractMainText(...args),
  truncateTextForPrompt: (...args: unknown[]) =>
    mockTruncateTextForPrompt(...args),
}));

const mockExtractDrills = jest.fn();
jest.mock("@/lib/ai/web-drill-extraction", () => ({
  extractDrillsFromWebPageText: (...args: unknown[]) =>
    mockExtractDrills(...args),
  WEB_DRILL_EXTRACTION_PROMPT_VERSION: "v1",
}));

import { POST } from "@/app/api/drills/import/web/route";

function setupSupabaseChains() {
  mockFrom.mockImplementation((table: string) => {
    if (table === "web_import_cache") {
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

describe("POST /api/drills/import/web", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    mockValidateUrl.mockResolvedValue("https://example.com/page");
    mockNormalizeUrlForCache.mockReturnValue("https://example.com/page/");
    mockFetchPageHtml.mockResolvedValue("<html></html>");
    mockExtractMainText.mockReturnValue("a".repeat(250));
    mockTruncateTextForPrompt.mockReturnValue("a".repeat(150));

    mockMaybeSingle.mockResolvedValue({ data: null });

    mockUpsert.mockResolvedValue({ error: null });

    mockExtractDrills.mockResolvedValue([
      {
        Category: "Warmup",
        Name: "Layup lines",
        Minutes: 5,
        Notes: "Full court",
        "Media Links": "https://example.com/page/",
      },
    ]);

    setupSupabaseChains();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("no session"),
    });

    const req = new NextRequest("http://localhost/api/drills/import/web", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when url is missing", async () => {
    const req = new NextRequest("http://localhost/api/drills/import/web", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when url is invalid", async () => {
    mockValidateUrl.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/drills/import/web", {
      method: "POST",
      body: JSON.stringify({ url: "not a url" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns success with rows when page fetch + AI succeed", async () => {
    const req = new NextRequest("http://localhost/api/drills/import/web", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/page" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0].Name).toBe("Layup lines");
    expect(body.cached).toBe(false);
    expect(mockExtractDrills).toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalled();
  });
});

