-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Extends Supabase auth.users with additional profile information
-- and Shopify integration fields
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  
  -- Shopify Integration
  shopify_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trial', -- 'trial', 'active', 'cancelled', 'expired'
  trial_end_date TIMESTAMP WITH TIME ZONE,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (via trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- DRILLS TABLE
-- ============================================
CREATE TABLE drills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  description TEXT,
  steps TEXT[], -- array of steps
  coaching_points TEXT[],
  diagram_url TEXT, -- Supabase Storage URL
  source_url TEXT, -- For tracking imports from YouTube/web
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on drills
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own drills
CREATE POLICY "Users can view own drills"
  ON drills FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own drills
CREATE POLICY "Users can insert own drills"
  ON drills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own drills
CREATE POLICY "Users can update own drills"
  ON drills FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own drills
CREATE POLICY "Users can delete own drills"
  ON drills FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on drills
CREATE TRIGGER update_drills_updated_at
  BEFORE UPDATE ON drills
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for faster queries
CREATE INDEX drills_user_id_idx ON drills(user_id);
CREATE INDEX drills_category_idx ON drills(category);

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT, -- Supabase Storage URL
  primary_color TEXT, -- Hex color (e.g., #FF5733)
  secondary_color TEXT, -- Hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own teams
CREATE POLICY "Users can view own teams"
  ON teams FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own teams
CREATE POLICY "Users can insert own teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own teams
CREATE POLICY "Users can update own teams"
  ON teams FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own teams
CREATE POLICY "Users can delete own teams"
  ON teams FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for faster queries
CREATE INDEX teams_user_id_idx ON teams(user_id);

-- ============================================
-- PRACTICE PLANS TABLE
-- ============================================
CREATE TABLE practice_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  total_duration INTEGER, -- in minutes
  blocks JSONB NOT NULL, -- Store the full plan structure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on practice_plans
ALTER TABLE practice_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own practice plans
CREATE POLICY "Users can view own practice plans"
  ON practice_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own practice plans
CREATE POLICY "Users can insert own practice plans"
  ON practice_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own practice plans
CREATE POLICY "Users can update own practice plans"
  ON practice_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own practice plans
CREATE POLICY "Users can delete own practice plans"
  ON practice_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on practice_plans
CREATE TRIGGER update_practice_plans_updated_at
  BEFORE UPDATE ON practice_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for faster queries
CREATE INDEX practice_plans_user_id_idx ON practice_plans(user_id);
CREATE INDEX practice_plans_team_id_idx ON practice_plans(team_id);
CREATE INDEX practice_plans_created_at_idx ON practice_plans(created_at DESC);

