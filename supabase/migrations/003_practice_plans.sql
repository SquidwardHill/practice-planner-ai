-- Practice plans table for saving finalized plans

CREATE TABLE practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  practice_title TEXT NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_practice_plans_user_id ON practice_plans(user_id);
CREATE INDEX idx_practice_plans_created_at ON practice_plans(created_at DESC);

ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own practice plans"
  ON practice_plans FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own practice plans"
  ON practice_plans FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own practice plans"
  ON practice_plans FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own practice plans"
  ON practice_plans FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_practice_plans_updated_at
  BEFORE UPDATE ON practice_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
