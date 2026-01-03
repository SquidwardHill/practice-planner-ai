-- Drills table for storing user's practice drills

-- Drills table
CREATE TABLE drills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields from XLS/CSV import
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  minutes INTEGER DEFAULT 0,
  notes TEXT,
  media_links TEXT, -- Store as comma-separated string or JSON array
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_drill_name UNIQUE(user_id, name) -- Prevent duplicates per user
);

-- Indexes for performance
CREATE INDEX idx_drills_user_id ON drills(user_id);
CREATE INDEX idx_drills_category ON drills(category);
CREATE INDEX idx_drills_user_category ON drills(user_id, category);

-- Enable RLS
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own drills"
  ON drills FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own drills"
  ON drills FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own drills"
  ON drills FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own drills"
  ON drills FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Auto-update updated_at trigger (reuse existing function)
CREATE TRIGGER update_drills_updated_at
  BEFORE UPDATE ON drills
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

