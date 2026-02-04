-- Run this in Supabase Dashboard → SQL Editor if practice_plans / scheduled_practices
-- don't exist on remote (e.g. migrations 003 and 004 didn't apply in order).
-- Uses gen_random_uuid() so no uuid-ossp extension is required.

-- 1) Practice plans (003)
CREATE TABLE IF NOT EXISTS practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_title TEXT NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_plans_user_id ON practice_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_created_at ON practice_plans(created_at DESC);

ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'practice_plans' AND policyname = 'Users can view own practice plans') THEN
    CREATE POLICY "Users can view own practice plans" ON practice_plans FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'practice_plans' AND policyname = 'Users can insert own practice plans') THEN
    CREATE POLICY "Users can insert own practice plans" ON practice_plans FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'practice_plans' AND policyname = 'Users can update own practice plans') THEN
    CREATE POLICY "Users can update own practice plans" ON practice_plans FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'practice_plans' AND policyname = 'Users can delete own practice plans') THEN
    CREATE POLICY "Users can delete own practice plans" ON practice_plans FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_practice_plans_updated_at ON practice_plans;
CREATE TRIGGER update_practice_plans_updated_at
  BEFORE UPDATE ON practice_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2) Scheduled practices (004)
CREATE TABLE IF NOT EXISTS scheduled_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_plan_id UUID NOT NULL REFERENCES practice_plans(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, scheduled_date)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_practices_user_id ON scheduled_practices(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_practices_scheduled_date ON scheduled_practices(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_practices_user_date ON scheduled_practices(user_id, scheduled_date);

ALTER TABLE scheduled_practices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_practices' AND policyname = 'Users can view own scheduled practices') THEN
    CREATE POLICY "Users can view own scheduled practices" ON scheduled_practices FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_practices' AND policyname = 'Users can insert own scheduled practices') THEN
    CREATE POLICY "Users can insert own scheduled practices" ON scheduled_practices FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_practices' AND policyname = 'Users can update own scheduled practices') THEN
    CREATE POLICY "Users can update own scheduled practices" ON scheduled_practices FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_practices' AND policyname = 'Users can delete own scheduled practices') THEN
    CREATE POLICY "Users can delete own scheduled practices" ON scheduled_practices FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;
