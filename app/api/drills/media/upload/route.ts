import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/webm",
  "application/pdf",
];

// const avatarFile = event.target.files[0];
// const { data, error } = await supabase.storage
//   .from("avatars")
//   .upload(
//     `${user.id}/${friendlyName}-${timestamp}-${random}.${fileExtension}`,
//     avatarFile,
//     {
//       cacheControl: "3600",
//       upsert: false,
//     },
//   );

/**
 * POST /api/drills/media/upload
 * Upload media files to Supabase Storage for a drill
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const fileNames = formData.getAll("fileNames") as string[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Helper function to sanitize filename
    const sanitizeFileName = (name: string): string => {
      return name
        .replace(/[^a-z0-9\s-]/gi, "") // Remove special chars except spaces and hyphens
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .toLowerCase()
        .substring(0, 50) // Limit length
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
    };

    // Validate files
    const validatedFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size exceeds 50MB limit`);
        continue;
      }

      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(
          `${file.name}: File type not supported. Allowed types: images, videos, PDFs`,
        );
        continue;
      }

      validatedFiles.push(file);
    }

    if (validatedFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid files to upload", details: errors },
        { status: 400 },
      );
    }

    // Upload files to Supabase Storage
    const uploadedUrls: string[] = [];
    const uploadErrors: string[] = [];
    const BUCKET_NAME = "Drill Media"; // Match exact bucket name from Supabase

    // Note: We attempt the upload directly. If the bucket doesn't exist or there are
    // permission issues, the upload will fail with a clear error message that we handle below.

    for (let i = 0; i < validatedFiles.length; i++) {
      const file = validatedFiles[i];
      try {
        // Get friendly name if provided, otherwise use original filename
        const friendlyName = fileNames[i] || file.name.replace(/\.[^/.]+$/, "");
        const sanitizedName = sanitizeFileName(friendlyName) || "file";
        const fileExtension = file.name.split(".").pop() || "bin";
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);

        // Generate filename: userId/sanitized-friendly-name-timestamp-random.extension
        const fileName = `${user.id}/${sanitizedName}-${timestamp}-${random}.${fileExtension}`;

        console.log(
          `Uploading ${file.name} (${file.size} bytes) to ${BUCKET_NAME}/${fileName}`,
        );

        // Read file as ArrayBuffer for server-side upload
        const arrayBuffer = await file.arrayBuffer();

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, arrayBuffer, {
            contentType: file.type,
            upsert: false, // Don't overwrite existing files
          });

        if (uploadError) {
          // StorageError has: message (string), code (string), and potentially statusCode at runtime
          // TypeScript type definition may not include all properties, so we use type assertion
          const errorWithStatus = uploadError as {
            message: string;
            code?: string;
            statusCode?: number | string;
            error?: string;
          };
          
          console.error(`Upload error for ${file.name}:`, {
            message: errorWithStatus.message,
            code: errorWithStatus.code,
            statusCode: errorWithStatus.statusCode,
            error: uploadError,
            fileName,
            bucketName: BUCKET_NAME,
            userId: user.id,
          });
          
          // Provide more helpful error messages
          let errorMessage = errorWithStatus.message;
          const errorMsgLower = errorWithStatus.message?.toLowerCase() || "";
          const statusCode = errorWithStatus.statusCode;
          const errorCode = errorWithStatus.code;
          
          // Check error code first (most reliable), then status code, then message
          if (errorCode === "NoSuchBucket" || statusCode === 404 || errorMsgLower.includes("bucket") && errorMsgLower.includes("not found")) {
            errorMessage = `Bucket "${BUCKET_NAME}" not found. Please create it in Supabase Dashboard > Storage. Make sure the bucket name matches exactly (case-sensitive).`;
          } else if (
            errorCode === "InvalidJWT" || 
            statusCode === 401 ||
            errorMsgLower.includes("unauthorized") ||
            errorMsgLower.includes("invalid jwt")
          ) {
            errorMessage = `Authentication failed. Please sign in again.`;
          } else if (
            errorCode === "EntityTooLarge" ||
            statusCode === 413 ||
            errorMsgLower.includes("too large")
          ) {
            errorMessage = `File too large. Maximum size is 50MB`;
          } else if (
            errorCode === "KeyAlreadyExists" ||
            statusCode === 409 ||
            errorMsgLower.includes("already exists")
          ) {
            errorMessage = `File already exists at this path.`;
          } else if (
            statusCode === 403 ||
            errorMsgLower.includes("policy") || 
            errorMsgLower.includes("permission") ||
            errorMsgLower.includes("forbidden")
          ) {
            errorMessage = `Permission denied. Check storage policies for bucket "${BUCKET_NAME}". Ensure the INSERT policy allows uploads to your user folder (${user.id}/). Run the storage-policy-drill-media.sql file in Supabase SQL Editor if you haven't already.`;
          } else if (statusCode === 400 || errorCode === "InvalidRequest") {
            errorMessage = `Invalid request: ${errorWithStatus.message}`;
          }
          
          uploadErrors.push(`${file.name}: ${errorMessage}`);
          continue;
        }

        if (!data) {
          console.error(`No data returned for ${file.name}`);
          uploadErrors.push(`${file.name}: No data returned from upload`);
          continue;
        }

        console.log(`Upload successful for ${file.name}:`, {
          path: data.path,
          id: data.id,
        });

        // Get URL - for private buckets, we still use getPublicUrl but it requires auth
        // For images to display, the bucket should be public OR we need signed URLs
        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

        // Verify the upload actually worked by checking the file exists
        const { data: fileCheck, error: checkError } = await supabase.storage
          .from(BUCKET_NAME)
          .list(user.id, {
            limit: 1,
            search: data.path.split("/").pop(),
          });

        if (checkError) {
          console.warn(`Could not verify uploaded file ${file.name}:`, checkError);
        }

        console.log(`Successfully uploaded ${file.name} to ${publicUrl}`);
        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        uploadErrors.push(
          `${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`,
        );
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to upload files",
          details: uploadErrors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      uploaded: uploadedUrls.length,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined,
    });
  } catch (error) {
    console.error("Unexpected error uploading media:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
