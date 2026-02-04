import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { type Drill } from "@/lib/types/drill";
import { H1, H2, H4, P } from "@/components/atoms/typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  FileText,
  Image,
  Video,
  ExternalLink,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DrillEditButton } from "@/components/molecules/drill-edit-button";

interface DrillDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DrillDetailPage({
  params,
}: DrillDetailPageProps) {
  const { user } = await getAuthState();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const supabase = await createClient();

  // Fetch drill with category name
  const { data: drill, error } = await supabase
    .from("drills")
    .select("*, categories(id, name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !drill) {
    redirect("/library");
  }

  const mediaLinks = drill.media_links
    ? drill.media_links
        .split(",")
        .map((link: string) => link.trim())
        .filter(Boolean)
    : [];

  // Parse minutes as integer for proper display
  const minutesInt = drill.minutes ? Math.floor(Number(drill.minutes)) : 0;

  // Check if URL is a YouTube video
  const isYouTubeUrl = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes("youtube.com") ||
      lowerUrl.includes("youtu.be") ||
      lowerUrl.includes("youtube.com/embed") ||
      lowerUrl.includes("m.youtube.com")
    );
  };

  // Extract YouTube video ID and convert to embed URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!isYouTubeUrl(url)) return null;

    // Pattern 1: youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID
    const watchMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
    );
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // Pattern 2: Already an embed URL
    if (url.includes("youtube.com/embed/")) {
      const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch && embedMatch[1]) {
        return `https://www.youtube.com/embed/${embedMatch[1]}`;
      }
    }

    return null;
  };

  const getFileType = (
    url: string
  ): "image" | "video" | "youtube" | "other" => {
    if (isYouTubeUrl(url)) {
      return "youtube";
    }
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      return "image";
    }
    if (lowerUrl.match(/\.(mp4|webm|mov|avi|mpeg)$/)) {
      return "video";
    }
    return "other";
  };

  // Filter media links by type
  const images = mediaLinks.filter(
    (url: string) => getFileType(url) === "image"
  );
  const youtubeVideos = mediaLinks.filter(
    (url: string) => getFileType(url) === "youtube"
  );
  const videos = mediaLinks.filter(
    (url: string) => getFileType(url) === "video"
  );
  const otherFiles = mediaLinks.filter(
    (url: string) => getFileType(url) === "other"
  );

  const getFileName = (url: string): string => {
    try {
      // Try to extract filename from URL
      const urlParts = url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      // Remove query params if any
      const cleanName = fileName.split("?")[0];
      // Try to extract friendly name from format: friendly-name-timestamp-random.ext
      const parts = cleanName.split("-");
      if (parts.length >= 3) {
        // Remove timestamp and random parts, keep the friendly name parts
        const friendlyParts = parts.slice(0, -2);
        const extension = parts[parts.length - 1].split(".").pop();
        const friendlyName = friendlyParts.join("-");
        return friendlyName ? `${friendlyName}.${extension}` : cleanName;
      }
      return cleanName;
    } catch {
      return url;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-12">
        <Link href="/library">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </Link>
        <DrillEditButton drill={drill} />
      </div>

      <div className="space-y-6">
        {/* Header */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {drill.categories?.name ?? "—"}
                </Badge>
                {minutesInt > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground bg-muted/50"
                  >
                    {minutesInt} {minutesInt === 1 ? "min" : "mins"}
                  </Badge>
                )}
              </div>
              <H1 className="mb-2">{drill.name}</H1>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        {drill.notes && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-2xl ">Notes</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <P className="whitespace-pre-wrap wrap-break-word max-w-full">
                {drill.notes ?? "There's nothing here yet."}
              </P>
            </CardContent>
          </Card>
        )}

        {/* Media Links Section */}
        {mediaLinks.length > 0 && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-2xl flex items-center justify-between">
                Media
                <Badge variant="outline" className="text-xs">
                  {mediaLinks.length > 0
                    ? `${mediaLinks.length} ${
                        mediaLinks.length === 1 ? "reference" : "references"
                      }`
                    : "No media referenced"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {images.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <H4>Images</H4>
                      <Badge variant="outline" className="text-xs rounded-full">
                        {images.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {images.map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block rounded-lg border bg-card overflow-hidden hover:border-primary transition-all hover:shadow-md"
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={url}
                              alt={getFileName(url)}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <ExternalLink className="h-5 w-5 text-white drop-shadow-lg" />
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {getFileName(url)}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* YouTube Videos */}
                {youtubeVideos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 mt-12">
                      <H4>YouTube Videos</H4>
                      <Badge variant="outline" className="text-xs rounded-full">
                        {youtubeVideos.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {youtubeVideos.map((url: string, index: number) => {
                        const embedUrl = getYouTubeEmbedUrl(url);
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block rounded-lg border bg-card overflow-hidden hover:border-primary transition-all hover:shadow-md"
                          >
                            <div className="aspect-video relative overflow-hidden">
                              {embedUrl ? (
                                <iframe
                                  src={embedUrl}
                                  title={getFileName(url)}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <ExternalLink className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ExternalLink className="h-5 w-5 text-white drop-shadow-lg" />
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-xs text-muted-foreground truncate">
                                {getFileName(url)}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Regular Video Files */}
                {videos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 mt-12">
                      <H4>Video Files</H4>
                      <Badge variant="outline" className="text-xs rounded-full">
                        {videos.length}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {videos.map((url: string, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="rounded-lg overflow-hidden border bg-black">
                            <video
                              src={url}
                              controls
                              className="w-full max-h-[500px]"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">
                              {getFileName(url)}
                            </p>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              Open in new tab
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Files */}
                {otherFiles.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 mt-12">
                      <H4>Links</H4>
                      <Badge variant="outline" className="text-xs rounded-full">
                        {otherFiles.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {otherFiles.map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className=" hover:text-accent transition-colors inline-flex items-center gap-2 underline text-primary/90 "
                        >
                          <span className="flex-1 truncate text-sm">
                            {getFileName(url)}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-12 text-muted-foreground/80  font-mono space-y-1 text-xs px-4">
        {/* Metadata */}

        <div>
          <span className=" pr-2">Created:</span>
          <span>{new Date(drill.created_at).toLocaleDateString()}</span>
        </div>
        <div>
          <span className=" pr-2">Last Updated:</span>
          <span>{new Date(drill.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
