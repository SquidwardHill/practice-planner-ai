import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "Drill Media";

/**
 * GET /api/drills/media/verify
 * Diagnostic endpoint to verify Supabase Storage setup
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          authError: authError?.message,
        },
        { status: 401 }
      );
    }

    const diagnostics: Record<string, any> = {
      user: {
        id: user.id,
        email: user.email,
      },
      bucket: {
        name: BUCKET_NAME,
      },
    };

    // 1. List all buckets to see if "Drill Media" exists
    // Reference: https://supabase.com/docs/reference/javascript/storage-listbuckets
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      diagnostics.buckets = {
        available: buckets?.map((b: { name: string }) => b.name) || [],
        found: buckets?.some((b: { name: string }) => b.name === BUCKET_NAME) || false,
        error: bucketsError?.message,
      };
    } catch (error) {
      diagnostics.buckets = {
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 2. Try to list files in the bucket (should work if bucket exists and policies are correct)
    // Reference: https://supabase.com/docs/reference/javascript/storage-from-list
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(user.id, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      diagnostics.files = {
        count: files?.length || 0,
        files: files?.map((f: { name: string; metadata?: { size?: number }; created_at?: string }) => ({
          name: f.name,
          path: `${user.id}/${f.name}`,
          size: f.metadata?.size,
          created_at: f.created_at,
        })) || [],
        error: listError?.message,
        errorDetails: listError,
      };
    } catch (error) {
      diagnostics.files = {
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 3. Try to get public URL for a test path (to verify bucket configuration)
    // Reference: https://supabase.com/docs/reference/javascript/storage-from-getpublicurl
    try {
      const testPath = `${user.id}/test-file.txt`;
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(testPath);
      diagnostics.publicUrl = {
        testPath,
        publicUrl,
      };
    } catch (error) {
      diagnostics.publicUrl = {
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 4. Check if bucket is public or private using getBucket()
    // Reference: https://supabase.com/docs/reference/javascript/storage-getbucket
    try {
      const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME);
      diagnostics.bucketInfo = {
        public: bucketInfo?.public || false,
        id: bucketInfo?.id,
        name: bucketInfo?.name,
        created_at: bucketInfo?.created_at,
        error: bucketError?.message,
      };
    } catch (error) {
      diagnostics.bucketInfo = {
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 5. Check drills with media_links to see if URLs are being saved
    // Reference: https://supabase.com/docs/reference/javascript/using-filters
    try {
      const { data: drills, error: drillsError } = await supabase
        .from("drills")
        .select("id, name, media_links")
        .eq("user_id", user.id)
        .not("media_links", "is", null);

      const drillsWithMedia = drills || [];
      const allMediaUrls: string[] = [];
      drillsWithMedia.forEach((drill) => {
        if (drill.media_links) {
          const urls = drill.media_links.split(",").map((u: string) => u.trim()).filter(Boolean);
          allMediaUrls.push(...urls);
        }
      });

      diagnostics.drills = {
        totalWithMedia: drillsWithMedia.length,
        totalMediaUrls: allMediaUrls.length,
        drills: drillsWithMedia.map((d) => ({
          id: d.id,
          name: d.name,
          mediaCount: d.media_links ? d.media_links.split(",").filter((u: string) => u.trim()).length : 0,
          mediaLinks: d.media_links,
        })),
        error: drillsError?.message,
      };

      // 6. Compare storage files with drill media_links
      const storageFilePaths = diagnostics.files.files?.map((f: { path: string }) => f.path) || [];
      const storageFileUrls = storageFilePaths.map((path: string) => {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path);
        return publicUrl;
      });

      diagnostics.comparison = {
        filesInStorage: storageFilePaths.length,
        urlsInDrills: allMediaUrls.length,
        storageUrls: storageFileUrls,
        drillUrls: allMediaUrls,
        missingInDrills: storageFileUrls.filter((url: string) => !allMediaUrls.includes(url)),
        missingInStorage: allMediaUrls.filter((url: string) => {
          // Extract path from URL and check if it exists in storage
          try {
            const urlParts = url.split("/");
            const bucketIndex = urlParts.findIndex((part: string) => part === "public");
            if (bucketIndex > 0) {
              const path = urlParts.slice(bucketIndex + 2).join("/");
              return !storageFilePaths.includes(path);
            }
          } catch {
            // Ignore parsing errors
          }
          return false;
        }),
      };
    } catch (error) {
      diagnostics.drills = {
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // 7. Check storage policies (if we can query them)
    diagnostics.policies = {
      note: "Storage policies are set at the database level. Check Supabase dashboard > Storage > Policies",
      expectedPolicies: [
        "Users can upload to their own folder (INSERT)",
        "Users can read their own files (SELECT)",
        "Users can delete their own files (DELETE)",
        "Users can update their own files (UPDATE)",
      ],
    };

    const recommendations = [
      diagnostics.buckets.found === false
        ? `❌ Bucket "${BUCKET_NAME}" not found. Create it in Supabase Dashboard > Storage`
        : `✅ Bucket "${BUCKET_NAME}" exists`,
      diagnostics.files.error
        ? `❌ Error listing files: ${diagnostics.files.error}. Check storage policies.`
        : `✅ Can list files (found ${diagnostics.files.count} files)`,
      diagnostics.files.count === 0
        ? `⚠️ No files found in bucket. This could mean uploads are failing or no files have been uploaded yet.`
        : `✅ Found ${diagnostics.files.count} file(s) in your folder`,
      diagnostics.bucketInfo?.public === false
        ? `⚠️ Bucket is PRIVATE. Public URLs won't work. Consider making it public or using signed URLs.`
        : `✅ Bucket is PUBLIC (or policies allow access)`,
      diagnostics.drills?.totalWithMedia === 0
        ? `⚠️ No drills have media_links saved. URLs might not be getting saved when creating/editing drills.`
        : `✅ Found ${diagnostics.drills?.totalWithMedia} drill(s) with media_links`,
      diagnostics.comparison?.missingInDrills?.length > 0
        ? `⚠️ ${diagnostics.comparison.missingInDrills.length} file(s) in storage but not saved to any drill's media_links`
        : diagnostics.files.count > 0
        ? `✅ All storage files are linked to drills`
        : null,
    ].filter(Boolean);

    return NextResponse.json({
      success: true,
      diagnostics,
      recommendations,
    });
  } catch (error) {
    console.error("Error in verify endpoint:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
