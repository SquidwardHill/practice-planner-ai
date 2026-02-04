-- Categories table: user-defined categories for drills

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Associate drills with categories: add category_id, backfill from category text, drop category

-- 1) Create categories from existing distinct (user_id, category) in drills
INSERT INTO categories (user_id, name)
SELECT DISTINCT user_id, category
FROM drills
WHERE category IS NOT NULL AND category != '';

-- 2) Add category_id column (nullable until backfilled)
ALTER TABLE drills ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 3) Backfill category_id from category name (match by user_id + name)
UPDATE drills d
SET category_id = c.id
FROM categories c
WHERE c.user_id = d.user_id AND c.name = d.category;

-- 4) For any drill without a category (e.g. empty string), create "Uncategorized" and assign
INSERT INTO categories (user_id, name)
SELECT DISTINCT d.user_id, 'Uncategorized'
FROM drills d
WHERE d.category_id IS NULL
ON CONFLICT (user_id, name) DO NOTHING;

UPDATE drills d
SET category_id = c.id
FROM categories c
WHERE c.user_id = d.user_id AND c.name = 'Uncategorized'
AND d.category_id IS NULL;

-- 5) Make category_id required (all rows now backfilled)
ALTER TABLE drills ALTER COLUMN category_id SET NOT NULL;

-- 6) Drop old category column
ALTER TABLE drills DROP COLUMN category;

-- 7) Update indexes
DROP INDEX IF EXISTS idx_drills_category;
DROP INDEX IF EXISTS idx_drills_user_category;
CREATE INDEX idx_drills_category_id ON drills(category_id);
CREATE INDEX idx_drills_user_category ON drills(user_id, category_id);
