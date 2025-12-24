/**
 * Development/Staging Environment Helpers
 * 
 * These utilities help identify non-production environments
 * where dev tools should be enabled.
 */

/**
 * Check if we're in a development or staging environment
 * (not production)
 */
export function isNonProduction(): boolean {
  // Check NODE_ENV
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Check Vercel environment
  // VERCEL_ENV can be: 'production', 'preview', or 'development'
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return true;
  }

  // Check if we're on a Vercel preview URL
  // This is a client-side check, so it won't work in server components
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app")
    ) {
      // Only allow if it's not the production domain
      // You can customize this check based on your production domain
      return true;
    }
  }

  return false;
}

/**
 * Check if we're in a local development environment
 */
export function isLocalDevelopment(): boolean {
  if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
    return true;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  }

  return false;
}

/**
 * Check if we're in a Vercel preview/staging environment
 */
export function isVercelPreview(): boolean {
  return (
    process.env.VERCEL === "1" &&
    (process.env.VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "development")
  );
}

