import {
  checkUserAccess,
  getSubscriptionDetails,
  requireAccess,
} from "@/lib/supabase/subscription";
import { getProfile, hasActiveAccess } from "@/lib/supabase/queries";
import type { Profile, SubscriptionStatus } from "@/lib/supabase/database.types";

// Mock the queries module
jest.mock("@/lib/supabase/queries");

const mockGetProfile = getProfile as jest.MockedFunction<typeof getProfile>;
const mockHasActiveAccess = hasActiveAccess as jest.MockedFunction<
  typeof hasActiveAccess
>;

describe("Subscription Access Control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkUserAccess", () => {
    it("should return false access when profile not found", async () => {
      mockGetProfile.mockResolvedValue(null);

      const result = await checkUserAccess("user-123");

      expect(result.hasAccess).toBe(false);
      expect(result.status).toBe(null);
      expect(result.message).toBe("User profile not found");
    });

    it("should grant access for active subscription with valid end date", async () => {
      const profile: Profile = {
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

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(true);

      const result = await checkUserAccess("user-123");

      expect(result.hasAccess).toBe(true);
      expect(result.status).toBe("active");
      expect(result.message).toBeUndefined();
    });

    it("should deny access for expired active subscription", async () => {
      const profile: Profile = {
        id: "user-123",
        email: "expired@test.com",
        full_name: "Expired User",
        shopify_customer_id: "shopify_123",
        subscription_status: "active",
        trial_end_date: null,
        subscription_start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Expired
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(false);

      const result = await checkUserAccess("user-123");

      expect(result.hasAccess).toBe(false);
      expect(result.status).toBe("expired");
      expect(result.message).toBe("Your subscription has expired");
    });

    it("should grant access for valid trial", async () => {
      const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const profile: Profile = {
        id: "user-123",
        email: "trial@test.com",
        full_name: "Trial User",
        shopify_customer_id: null,
        subscription_status: "trial",
        trial_end_date: trialEndDate.toISOString(),
        subscription_start_date: null,
        subscription_end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(true);

      const result = await checkUserAccess("user-123");

      expect(result.hasAccess).toBe(true);
      expect(result.status).toBe("trial");
      expect(result.message).toContain("days remaining in trial");
    });

    it("should deny access for expired trial", async () => {
      const trialEndDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const profile: Profile = {
        id: "user-123",
        email: "expired_trial@test.com",
        full_name: "Expired Trial User",
        shopify_customer_id: null,
        subscription_status: "trial",
        trial_end_date: trialEndDate.toISOString(),
        subscription_start_date: null,
        subscription_end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(false);

      const result = await checkUserAccess("user-123");

      expect(result.hasAccess).toBe(false);
      expect(result.status).toBe("expired");
      expect(result.message).toBe("Your trial has expired");
    });

    it("should grant access for cancelled subscription with time remaining", async () => {
      const profile: Profile = {
        id: "user-123",
        email: "cancelled@test.com",
        full_name: "Cancelled User",
        shopify_customer_id: "shopify_456",
        subscription_status: "cancelled",
        trial_end_date: null,
        subscription_start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Still valid
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(true);

      const result = await checkUserAccess("user-123");

      expect(result.hasAccess).toBe(true);
      expect(result.status).toBe("cancelled");
      expect(result.message).toContain("cancelled but still active");
    });

    it("should deny access for cancelled subscription with no time remaining", async () => {
      const profile: Profile = {
        id: "user-123",
        email: "cancelled@test.com",
        full_name: "Cancelled User",
        shopify_customer_id: "shopify_456",
        subscription_status: "cancelled",
        trial_end_date: null,
        subscription_start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Expired
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(false);

      const result = await checkUserAccess("user-123");

      expect(result.hasAccess).toBe(false);
      expect(result.status).toBe("cancelled");
      expect(result.message).toBe("Your subscription has been cancelled");
    });

    it("should deny access for expired status", async () => {
      const profile: Profile = {
        id: "user-123",
        email: "expired@test.com",
        full_name: "Expired User",
        shopify_customer_id: "shopify_789",
        subscription_status: "expired",
        trial_end_date: null,
        subscription_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(false);

      const result = await checkUserAccess("user-123");

      expect(result.hasAccess).toBe(false);
      expect(result.status).toBe("expired");
      expect(result.message).toBe("No active subscription or trial");
    });
  });

  describe("getSubscriptionDetails", () => {
    it("should return null when profile not found", async () => {
      mockGetProfile.mockResolvedValue(null);
      mockHasActiveAccess.mockResolvedValue(false);

      const result = await getSubscriptionDetails("user-123");

      expect(result).toBe(null);
    });

    it("should return subscription details for active user", async () => {
      const profile: Profile = {
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

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(true);

      const result = await getSubscriptionDetails("user-123");

      expect(result).not.toBe(null);
      expect(result?.status).toBe("active");
      expect(result?.hasAccess).toBe(true);
      expect(result?.isActive).toBe(true);
      expect(result?.isTrial).toBe(false);
      expect(result?.isCancelled).toBe(false);
      expect(result?.isExpired).toBe(false);
      expect(result?.shopifyCustomerId).toBe("shopify_123");
    });

    it("should return subscription details for trial user", async () => {
      const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const profile: Profile = {
        id: "user-123",
        email: "trial@test.com",
        full_name: "Trial User",
        shopify_customer_id: null,
        subscription_status: "trial",
        trial_end_date: trialEndDate.toISOString(),
        subscription_start_date: null,
        subscription_end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(true);

      const result = await getSubscriptionDetails("user-123");

      expect(result).not.toBe(null);
      expect(result?.status).toBe("trial");
      expect(result?.hasAccess).toBe(true);
      expect(result?.isTrial).toBe(true);
      expect(result?.isActive).toBe(false);
      expect(result?.trialEndDate).toBe(trialEndDate.toISOString());
    });
  });

  describe("requireAccess", () => {
    it("should not throw when user has access", async () => {
      const profile: Profile = {
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

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(true);

      await expect(requireAccess("user-123")).resolves.not.toThrow();
    });

    it("should throw error when user does not have access", async () => {
      const profile: Profile = {
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

      mockGetProfile.mockResolvedValue(profile);
      mockHasActiveAccess.mockResolvedValue(false);

      await expect(requireAccess("user-123")).rejects.toThrow(
        "No active subscription or trial"
      );
    });

    it("should throw error when profile not found", async () => {
      mockGetProfile.mockResolvedValue(null);
      mockHasActiveAccess.mockResolvedValue(false);

      await expect(requireAccess("user-123")).rejects.toThrow(
        "User profile not found"
      );
    });
  });
});

