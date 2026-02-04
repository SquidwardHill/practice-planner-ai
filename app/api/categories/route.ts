import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/categories
 * List the authenticated user's categories (for drill association).
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: categories, error: fetchError } = await supabase
      .from("categories")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (fetchError) {
      console.error("Error fetching categories:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch categories", details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(categories ?? []);
  } catch (error) {
    console.error("Error in GET /api/categories:", error);
    return NextResponse.json(
      {
        error: "Error fetching categories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a category for the authenticated user. Body: { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const trimmed = name.trim();

    const { data: category, error: insertError } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name: trimmed })
      .select("id, name, created_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 409 }
        );
      }
      console.error("Error creating category:", insertError);
      return NextResponse.json(
        { error: "Failed to create category", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error in POST /api/categories:", error);
    return NextResponse.json(
      {
        error: "Error creating category",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
