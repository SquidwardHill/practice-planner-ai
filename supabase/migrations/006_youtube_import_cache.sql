-- Cache for YouTube smart import: transcript hash + extracted drill rows per user/video

CREATE TABLE youtube_import_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  transcript_hash TEXT NOT NULL,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, video_id),
  CONSTRAINT youtube_import_cache_video_id_len CHECK (char_length(video_id) = 11)
);

CREATE INDEX idx_youtube_import_cache_user_id ON youtube_import_cache(user_id);

ALTER TABLE youtube_import_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own youtube import cache"
  ON youtube_import_cache FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own youtube import cache"
  ON youtube_import_cache FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own youtube import cache"
  ON youtube_import_cache FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own youtube import cache"
  ON youtube_import_cache FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_youtube_import_cache_updated_at
  BEFORE UPDATE ON youtube_import_cache
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
