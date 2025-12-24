import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonProduction } from "@/lib/utils/dev-helpers";

/**
 * Dev-only API route to switch between test users
 * Works in development and staging/preview environments
 */
export async function POST(request: NextRequest) {
  // Only allow in non-production environments
  if (!isNonProduction()) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in as the requested user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: data.user?.email,
        id: data.user?.id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to switch user" },
      { status: 500 }
    );
  }
}

