import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonProduction } from "@/lib/utils/dev-helpers";

/**
 * Dev-only API route to get current user
 * Works in development and staging/preview environments
 */
export async function GET() {
  // Only allow in non-production environments
  if (!isNonProduction()) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json({
      email: user?.email || null,
      id: user?.id || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get current user" },
      { status: 500 }
    );
  }
}

