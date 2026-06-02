-- Cache for Web smart import: page text content hash + extracted drill rows per user/url

CREATE TABLE web_import_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, url)
);

CREATE INDEX idx_web_import_cache_user_id ON web_import_cache(user_id);

ALTER TABLE web_import_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own web import cache"
  ON web_import_cache FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own web import cache"
  ON web_import_cache FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own web import cache"
  ON web_import_cache FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own web import cache"
  ON web_import_cache FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_web_import_cache_updated_at
  BEFORE UPDATE ON web_import_cache
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

