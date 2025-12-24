import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Dev-only API route to get current user
 * Only works in development mode
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
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

