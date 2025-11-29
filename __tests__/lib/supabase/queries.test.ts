import {
  getProfile,
  hasActiveAccess,
  getUserDrills,
  getDrill,
  createDrill,
  updateDrill,
  deleteDrill,
  bulkInsertDrills,
  getUserTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getUserPracticePlans,
  getPracticePlan,
  createPracticePlan,
  updatePracticePlan,
  deletePracticePlan,
} from "@/lib/supabase/queries";
import type {
  Profile,
  Drill,
  Team,
  PracticePlan,
  DrillInsert,
  TeamInsert,
  PracticePlanInsert,
} from "@/lib/supabase/database.types";
import { supabase as serverSupabase } from "@/lib/supabase/server";

// Mock the server Supabase client
jest.mock("@/lib/supabase/server", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockFrom = serverSupabase.from as jest.MockedFunction<
  typeof serverSupabase.from
>;

describe("Database Queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should return profile when found", async () => {
      const mockProfile: Profile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        shopify_customer_id: null,
        subscription_status: "trial",
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_start_date: null,
        subscription_end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      } as any);
      mockSelect.mockReturnValue({
        eq: mockEq,
      } as any);
      mockEq.mockReturnValue({
        single: mockSingle,
      } as any);

      const result = await getProfile("user-123");

      expect(result).toEqual(mockProfile);
      expect(mockFrom).toHaveBeenCalledWith("profiles");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("id", "user-123");
    });

    it("should return null when profile not found", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      } as any);
      mockSelect.mockReturnValue({
        eq: mockEq,
      } as any);
      mockEq.mockReturnValue({
        single: mockSingle,
      } as any);

      const result = await getProfile("user-123");

      expect(result).toBe(null);
    });
  });

  describe("hasActiveAccess", () => {
    it("should return true for active subscription", async () => {
      const mockProfile: Profile = {
        id: "user-123",
        email: "active@test.com",
        full_name: "Active User",
        shopify_customer_id: "shopify_123",
        subscription_status: "active",
        trial_end_date: null,
        subscription_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      } as any);
      mockSelect.mockReturnValue({
        eq: mockEq,
      } as any);
      mockEq.mockReturnValue({
        single: mockSingle,
      } as any);

      const result = await hasActiveAccess("user-123");

      expect(result).toBe(true);
    });

    it("should return false for expired subscription", async () => {
      const mockProfile: Profile = {
        id: "user-123",
        email: "expired@test.com",
        full_name: "Expired User",
        shopify_customer_id: "shopify_123",
        subscription_status: "expired",
        trial_end_date: null,
        subscription_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      } as any);
      mockSelect.mockReturnValue({
        eq: mockEq,
      } as any);
      mockEq.mockReturnValue({
        single: mockSingle,
      } as any);

      const result = await hasActiveAccess("user-123");

      expect(result).toBe(false);
    });
  });

  describe("getUserDrills", () => {
    it("should return array of drills for user", async () => {
      const mockDrills: Drill[] = [
        {
          id: "drill-1",
          user_id: "user-123",
          name: "3-Man Weave",
          category: "Warmup",
          duration: 10,
          description: "Test drill",
          steps: ["Step 1"],
          coaching_points: ["Point 1"],
          diagram_url: null,
          source_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: mockDrills,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      } as any);
      mockSelect.mockReturnValue({
        eq: mockEq,
      } as any);
      mockEq.mockReturnValue({
        order: mockOrder,
      } as any);

      const result = await getUserDrills("user-123");

      expect(result).toEqual(mockDrills);
      expect(mockFrom).toHaveBeenCalledWith("drills");
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("should return empty array on error", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockFrom.mockReturnValue({
        select: mockSelect,
      } as any);
      mockSelect.mockReturnValue({
        eq: mockEq,
      } as any);
      mockEq.mockReturnValue({
        order: mockOrder,
      } as any);

      const result = await getUserDrills("user-123");

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe("createDrill", () => {
    it("should create and return drill", async () => {
      const drillData: DrillInsert = {
        user_id: "user-123",
        name: "New Drill",
        category: "Defense",
        duration: 15,
        description: "Test description",
        steps: ["Step 1"],
        coaching_points: ["Point 1"],
        diagram_url: null,
        source_url: null,
      };

      const createdDrill: Drill = {
        ...drillData,
        id: "drill-new",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: createdDrill,
        error: null,
      });

      mockFrom.mockReturnValue({
        insert: mockInsert,
      } as any);
      mockInsert.mockReturnValue({
        select: mockSelect,
      } as any);
      mockSelect.mockReturnValue({
        single: mockSingle,
      } as any);

      const result = await createDrill("user-123", drillData);

      expect(result).toEqual(createdDrill);
      expect(mockInsert).toHaveBeenCalledWith({
        ...drillData,
        user_id: "user-123",
      });
    });
  });

  describe("bulkInsertDrills", () => {
    it("should return success and error counts", async () => {
      const drills: DrillInsert[] = [
        {
          user_id: "user-123",
          name: "Drill 1",
          category: "Warmup",
          duration: 10,
          description: null,
          steps: null,
          coaching_points: null,
          diagram_url: null,
          source_url: null,
        },
        {
          user_id: "user-123",
          name: "Drill 2",
          category: "Defense",
          duration: 15,
          description: null,
          steps: null,
          coaching_points: null,
          diagram_url: null,
          source_url: null,
        },
      ];

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          { id: "drill-1", ...drills[0] },
          { id: "drill-2", ...drills[1] },
        ],
        error: null,
      });

      mockFrom.mockReturnValue({
        insert: mockInsert,
      } as any);
      mockInsert.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await bulkInsertDrills("user-123", drills);

      expect(result.success).toBe(2);
      expect(result.errors).toBe(0);
    });

    it("should handle partial failures", async () => {
      const drills: DrillInsert[] = [
        {
          user_id: "user-123",
          name: "Drill 1",
          category: "Warmup",
          duration: 10,
          description: null,
          steps: null,
          coaching_points: null,
          diagram_url: null,
          source_url: null,
        },
        {
          user_id: "user-123",
          name: "Drill 2",
          category: "Defense",
          duration: 15,
          description: null,
          steps: null,
          coaching_points: null,
          diagram_url: null,
          source_url: null,
        },
      ];

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: "drill-1", ...drills[0] }], // Only one succeeded
        error: null,
      });

      mockFrom.mockReturnValue({
        insert: mockInsert,
      } as any);
      mockInsert.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await bulkInsertDrills("user-123", drills);

      expect(result.success).toBe(1);
      expect(result.errors).toBe(1);
    });
  });
});

