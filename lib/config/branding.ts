/**
 * Branding configuration
 *
 * Centralized product and AI names from environment variables.
 * Falls back to defaults if env vars are not set.
 */

export const PRODUCT_NAME =
  process.env.NEXT_PUBLIC_PRODUCT_NAME || "Practice Planner AI";

export const AI_NAME = process.env.NEXT_PUBLIC_AI_NAME || "Playbook";

// Convenience: Product name without "AI" suffix (for contexts where AI is separate)
export const PRODUCT_NAME_BASE =
  process.env.NEXT_PUBLIC_PRODUCT_NAME_BASE || "Playbook";
