-- ============================================
-- SMART NAGRIK — Add New City Template
-- Copy this file, fill in the details, and run in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: INSERT CITY
-- ============================================
-- Change these values for your city:
--   name        → Full city name
--   state       → State name
--   slug        → URL-friendly lowercase (used in code)
--   center_lat  → City center latitude
--   center_lng  → City center longitude
--   default_zoom → Map zoom level (11 for large city, 12-13 for smaller)

INSERT INTO cities (name, state, slug, center_lat, center_lng, default_zoom, is_active) VALUES
('Faridabad', 'Haryana', 'faridabad', 28.4089, 77.3178, 12, true);

-- ============================================
-- STEP 2: INSERT WARDS
-- ============================================
-- Add all wards for the city. Ward numbers must be unique within the city.
-- Copy-paste rows and change values.

INSERT INTO wards (city_id, number, area_name, sector, councillor_name, mla_name, zone) VALUES
((SELECT id FROM cities WHERE slug = 'faridabad'), 1, 'Old Faridabad', 'Sector 1', 'Councillor Name', 'MLA Name', 'Zone 1'),
((SELECT id FROM cities WHERE slug = 'faridabad'), 2, 'NIT Area', 'Sector 5', 'Councillor Name', 'MLA Name', 'Zone 1'),
((SELECT id FROM cities WHERE slug = 'faridabad'), 3, 'Ballabhgarh', 'Sector 12', 'Councillor Name', 'MLA Name', 'Zone 2');
-- ... add remaining wards

-- ============================================
-- STEP 3: INSERT ACCOUNTABILITY CHAIN
-- ============================================
-- This auto-generates 4 accountability entries per ward.
-- Change the org name and officer names for your city.

DO $$
DECLARE
  w RECORD;
  city_uuid uuid;
BEGIN
  SELECT id INTO city_uuid FROM cities WHERE slug = 'faridabad';
  FOR w IN SELECT id, number FROM wards WHERE city_id = city_uuid ORDER BY number LOOP
    INSERT INTO accountability_chain (city_id, ward_id, role, name, description, sort_order) VALUES
      (city_uuid, w.id, 'municipal_corporation', 'MCF Faridabad', 'Reports to Haryana State Government', 1),
      (city_uuid, w.id, 'commissioner', 'Commissioner Name (IAS)', 'Commissioner — City Head, top of chain', 2),
      (city_uuid, w.id, 'additional_commissioner', 'Addl. Commissioner Name', 'Additional Commissioner — Zone oversight', 3),
      (city_uuid, w.id, 'jhi', 'JHI Ward ' || w.number, 'Junior Health Inspector — Frontline ward officer', 4);
  END LOOP;
END $$;

-- ============================================
-- STEP 4 (OPTIONAL): INSERT SAMPLE ISSUES
-- ============================================
-- Add a few sample issues to test the city on the map.

-- INSERT INTO issues (city_id, type, severity, status, description, latitude, longitude, address, ward_id, upvotes, created_at) VALUES
-- ((SELECT id FROM cities WHERE slug = 'faridabad'), 'pothole', 'critical', 'open', 'Description here', 28.4089, 77.3178, 'Location, Sector X', (SELECT id FROM wards WHERE number = 1 AND city_id = (SELECT id FROM cities WHERE slug = 'faridabad')), 0, now());

-- ============================================
-- DONE! Now change DEFAULT_CITY_SLUG in
-- src/lib/supabase.js to 'faridabad' to switch,
-- or build a city selector UI.
-- ============================================
