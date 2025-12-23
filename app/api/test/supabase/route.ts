import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Test Supabase Connection
 * GET /api/test/supabase
 * 
 * Simple endpoint to verify Supabase is accessible
 */
export async function GET() {
  try {
    // Check environment variables first (support both old and new names)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = 
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing environment variables",
          message: "Supabase URL and Key are required",
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "not set",
          },
          help: "Check your .env.local file has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
        },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();
    
    // Test basic connection
    const { data, error, count } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          message: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      profileCount: count || 0,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
        : "not set",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Connection failed",
        message: error.message,
        cause: error.cause?.message,
      },
      { status: 500 }
    );
  }
}

