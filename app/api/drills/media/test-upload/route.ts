import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "Drill Media";

/**
 * POST /api/drills/media/test-upload
 * Test endpoint to verify upload functionality
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", authError: authError?.message },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate test filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "bin";
    const fileName = `${user.id}/test-${timestamp}-${random}.${fileExtension}`;

    console.log(`[TEST] Uploading test file to ${BUCKET_NAME}/${fileName}`);

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[TEST] Upload error:", uploadError);
      return NextResponse.json(
        {
          error: "Upload failed",
          details: {
            message: uploadError.message,
            // statusCode: uploadError.statusCode, // Removed since StorageError does not have statusCode
            error: uploadError,
          },
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No data returned from upload" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    // Verify file exists
    const { data: fileList, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(user.id, {
        limit: 10,
        sortBy: { column: "created_at", order: "desc" },
      });

    const uploadedFile = fileList?.find((f) => f.name === data.path.split("/").pop());

    return NextResponse.json({
      success: true,
      message: "Test upload successful",
      details: {
        fileName,
        path: data.path,
        publicUrl,
        fileExists: !!uploadedFile,
        fileSize: uploadedFile?.metadata?.size,
        bucketIsPublic: null, // Can't determine from API, check dashboard
        note: "If bucket is private, publicUrl won't work for <img> tags. Make bucket public in Supabase Dashboard > Storage > Edit bucket",
      },
    });
  } catch (error) {
    console.error("[TEST] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
