-- Schedule: attach practice plans to dates (one practice per user per date)

CREATE TABLE scheduled_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE (user_id, scheduled_date)
);

CREATE INDEX idx_scheduled_practices_user_id ON scheduled_practices(user_id);
CREATE INDEX idx_scheduled_practices_scheduled_date ON scheduled_practices(scheduled_date);
CREATE INDEX idx_scheduled_practices_user_date ON scheduled_practices(user_id, scheduled_date);

ALTER TABLE scheduled_practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled practices"
  ON scheduled_practices FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own scheduled practices"
  ON scheduled_practices FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own scheduled practices"
  ON scheduled_practices FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own scheduled practices"
  ON scheduled_practices FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
