-- ============================================
-- SMART NAGRIK — Admin RLS Policies
-- Run this AFTER migration.sql in Supabase SQL Editor
-- Adds write permissions for authenticated (admin) users
-- Does NOT change anonymous webapp permissions
-- ============================================

-- CITIES: admin full CRUD
CREATE POLICY "cities_admin_insert" ON cities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cities_admin_update" ON cities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cities_admin_delete" ON cities FOR DELETE TO authenticated USING (true);

-- WARDS: admin full CRUD
CREATE POLICY "wards_admin_insert" ON wards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "wards_admin_update" ON wards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "wards_admin_delete" ON wards FOR DELETE TO authenticated USING (true);

-- ISSUES: admin update + delete (insert already exists for anon+auth)
CREATE POLICY "issues_admin_update" ON issues FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "issues_admin_delete" ON issues FOR DELETE TO authenticated USING (true);

-- UPVOTES: admin delete
CREATE POLICY "upvotes_admin_delete" ON upvotes FOR DELETE TO authenticated USING (true);

-- ACCOUNTABILITY CHAIN: admin full CRUD
CREATE POLICY "accountability_admin_insert" ON accountability_chain FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "accountability_admin_update" ON accountability_chain FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "accountability_admin_delete" ON accountability_chain FOR DELETE TO authenticated USING (true);

-- STORAGE: admin can delete photos
CREATE POLICY "issue_photos_admin_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'issue-photos');
