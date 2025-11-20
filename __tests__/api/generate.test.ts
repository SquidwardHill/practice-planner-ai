import { NextRequest } from "next/server";
import { generateMockPracticePlan } from "@/app/api/generate/mock-data";

// Mock the AI SDK before importing the route
jest.mock("ai", () => ({
  generateObject: jest.fn(),
}));

jest.mock("@ai-sdk/openai", () => ({
  openai: jest.fn(),
}));

// Import the route handler after mocks
import { POST } from "@/app/api/generate/route";

// Mock the AI SDK
jest.mock("ai", () => ({
  generateObject: jest.fn(),
}));

jest.mock("@ai-sdk/openai", () => ({
  openai: jest.fn(),
}));

describe("/api/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.USE_MOCK_API;
  });

  describe("POST", () => {
    it("should return 400 if prompt is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/generate", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe("Prompt is required");
    });

    it("should return 400 if prompt is empty", async () => {
      const req = new NextRequest("http://localhost:3000/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: "" }),
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it("should return mock data when OPENAI_API_KEY is not set", async () => {
      process.env.OPENAI_API_KEY = "";

      const req = new NextRequest("http://localhost:3000/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Create a 90-minute practice focusing on defense",
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("practice_title");
      expect(data).toHaveProperty("total_duration_minutes");
      expect(data).toHaveProperty("blocks");
      expect(Array.isArray(data.blocks)).toBe(true);
      expect(data.blocks.length).toBeGreaterThan(0);

      // Validate block structure
      data.blocks.forEach((block: any) => {
        expect(block).toHaveProperty("time_slot");
        expect(block).toHaveProperty("drill_name");
        expect(block).toHaveProperty("category");
        expect(block).toHaveProperty("duration");
        expect(block).toHaveProperty("notes");
        expect(typeof block.duration).toBe("number");
      });
    });

    it("should return mock data when USE_MOCK_API is true", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.USE_MOCK_API = "true";

      const req = new NextRequest("http://localhost:3000/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Create a 60-minute practice",
        }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("practice_title");
      expect(data).toHaveProperty("blocks");
    });

    it("should return valid practice plan structure", async () => {
      process.env.USE_MOCK_API = "true";

      const req = new NextRequest("http://localhost:3000/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt:
            "Create a 90-minute varsity basketball practice focusing on transition defense and conditioning",
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      // Validate top-level structure
      expect(data.practice_title).toBeTruthy();
      expect(typeof data.total_duration_minutes).toBe("number");
      expect(data.total_duration_minutes).toBeGreaterThan(0);

      // Validate blocks
      expect(data.blocks.length).toBeGreaterThan(0);

      // Check time slot format
      data.blocks.forEach((block: any, index: number) => {
        expect(block.time_slot).toMatch(/^\d+:\d{2} - \d+:\d{2}$/);
        expect(block.drill_name).toBeTruthy();
        expect(block.category).toBeTruthy();
        expect(block.duration).toBeGreaterThan(0);
      });
    });

    it("should handle different duration requests", async () => {
      process.env.USE_MOCK_API = "true";

      const req = new NextRequest("http://localhost:3000/api/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Create a 60-minute practice",
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.total_duration_minutes).toBeLessThanOrEqual(90);
    });
  });
});

describe("generateMockPracticePlan", () => {
  it("should generate a valid practice plan", () => {
    const plan = generateMockPracticePlan("Create a 90-minute practice");

    expect(plan).toHaveProperty("practice_title");
    expect(plan).toHaveProperty("total_duration_minutes");
    expect(plan).toHaveProperty("blocks");
    expect(plan.blocks.length).toBeGreaterThan(0);
  });

  it("should extract duration from prompt", () => {
    const plan = generateMockPracticePlan("Create a 60-minute practice");
    expect(plan.total_duration_minutes).toBeLessThanOrEqual(90);
  });

  it("should have valid time slots", () => {
    const plan = generateMockPracticePlan("Create a 90-minute practice");

    plan.blocks.forEach((block, index) => {
      expect(block.time_slot).toMatch(/^\d+:\d{2} - \d+:\d{2}$/);
    });
  });
});
