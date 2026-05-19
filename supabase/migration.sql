-- ============================================
-- SMART NAGRIK — Full Database Setup
-- Run this ONCE in the Supabase SQL Editor
-- It drops any old tables and creates everything fresh
-- ============================================

-- CLEAN SLATE: drop everything if it exists
DROP TABLE IF EXISTS accountability_chain CASCADE;
DROP TABLE IF EXISTS upvotes CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS wards CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP FUNCTION IF EXISTS increment_upvote CASCADE;
DROP POLICY IF EXISTS "issue_photos_upload" ON storage.objects;
DROP POLICY IF EXISTS "issue_photos_read" ON storage.objects;

-- ============================================
-- 1. CITIES TABLE
-- ============================================
CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  slug text UNIQUE NOT NULL,
  center_lat float8 NOT NULL,
  center_lng float8 NOT NULL,
  default_zoom int NOT NULL DEFAULT 11,
  boundary_geojson jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. WARDS TABLE
-- ============================================
CREATE TABLE wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  number int NOT NULL,
  area_name text NOT NULL,
  sector text NOT NULL,
  councillor_name text NOT NULL,
  mla_name text NOT NULL,
  zone text NOT NULL DEFAULT 'Zone 1',
  created_at timestamptz DEFAULT now(),
  UNIQUE(city_id, number)
);

-- ============================================
-- 3. ISSUES TABLE
-- ============================================
CREATE TABLE issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('pothole', 'garbage', 'water')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  description text,
  photo_url text,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  address text NOT NULL,
  ward_id uuid REFERENCES wards(id),
  upvotes int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. UPVOTES TABLE
-- ============================================
CREATE TABLE upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  device_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(issue_id, device_token)
);

-- ============================================
-- 5. ACCOUNTABILITY CHAIN TABLE
-- ============================================
CREATE TABLE accountability_chain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  ward_id uuid NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  role text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_wards_city_id ON wards(city_id);
CREATE INDEX idx_issues_city_id ON issues(city_id);
CREATE INDEX idx_issues_type ON issues(type);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_ward_id ON issues(ward_id);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_upvotes_issue_id ON upvotes(issue_id);
CREATE INDEX idx_upvotes_device ON upvotes(device_token);
CREATE INDEX idx_accountability_ward ON accountability_chain(ward_id);
CREATE INDEX idx_accountability_city ON accountability_chain(city_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_chain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cities_select" ON cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "wards_select" ON wards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "issues_select" ON issues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "issues_insert" ON issues FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "upvotes_select" ON upvotes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "upvotes_insert" ON upvotes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "accountability_select" ON accountability_chain FOR SELECT TO anon, authenticated USING (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-photos', 'issue-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "issue_photos_upload" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'issue-photos');

CREATE POLICY "issue_photos_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'issue-photos');

-- ============================================
-- UPVOTE TRIGGER
-- ============================================
CREATE FUNCTION increment_upvote()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE issues SET upvotes = upvotes + 1 WHERE id = NEW.issue_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_upvote_insert
AFTER INSERT ON upvotes
FOR EACH ROW
EXECUTE FUNCTION increment_upvote();

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE upvotes;
