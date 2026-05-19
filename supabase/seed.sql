-- ============================================
-- SMART NAGRIK — Seed Data
-- Run AFTER migration.sql in Supabase SQL Editor
-- ============================================

-- ============================================
-- CITIES
-- ============================================
INSERT INTO cities (name, state, slug, center_lat, center_lng, default_zoom, is_active) VALUES
('Gurugram', 'Haryana', 'gurugram', 28.4595, 77.0266, 11, true);
-- Future cities (uncomment when ready):
-- ('Faridabad', 'Haryana', 'faridabad', 28.4089, 77.3178, 12, false),
-- ('Noida', 'Uttar Pradesh', 'noida', 28.5355, 77.3910, 12, false),
-- ('Chandigarh', 'Punjab/Haryana', 'chandigarh', 30.7333, 76.7794, 12, false);

-- ============================================
-- 35 GURGAON WARDS
-- ============================================
INSERT INTO wards (city_id, number, area_name, sector, councillor_name, mla_name, zone) VALUES
((SELECT id FROM cities WHERE slug = 'gurugram'), 1, 'Jacobpura', 'Sector 12', 'Suman Devi', 'Neeraj Sharma', 'Zone 1'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 2, 'Old Gurgaon', 'Sector 4', 'Ramesh Bharti', 'Neeraj Sharma', 'Zone 1'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 3, 'Civil Lines', 'Sector 10', 'Deepak Verma', 'Neeraj Sharma', 'Zone 1'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 4, 'Shivaji Nagar', 'Sector 11', 'Neelam Yadav', 'Neeraj Sharma', 'Zone 1'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 5, 'Sadar Bazaar', 'Sector 14', 'Anita Sharma', 'Sudhir Singh', 'Zone 1'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 6, 'Hans Enclave', 'Sector 15', 'Rajesh Jangra', 'Sudhir Singh', 'Zone 2'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 7, 'Palam Vihar', 'Sector 22', 'Poonam Chaudhary', 'Sudhir Singh', 'Zone 2'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 8, 'Leisure Valley', 'Sector 29', 'Sunil Yadav', 'Vinod Gupta', 'Zone 2'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 9, 'DLF Phase 1', 'Sector 26', 'Monika Singla', 'Vinod Gupta', 'Zone 2'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 10, 'Sushant Lok', 'Sector 28', 'Kiran Bala', 'Vinod Gupta', 'Zone 2'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 11, 'Maruti Kunj', 'Sector 33', 'Ravi Kumar', 'Mukesh Sharma', 'Zone 3'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 12, 'Rapid Metro Hub', 'Sector 45', 'Rakesh Kumar', 'Mukesh Sharma', 'Zone 3'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 13, 'Huda City Centre', 'Sector 44', 'Parveen Kaur', 'Mukesh Sharma', 'Zone 3'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 14, 'South City', 'Sector 41', 'Aarti Gupta', 'Mukesh Sharma', 'Zone 3'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 15, 'Sohna Road', 'Sector 48', 'Manoj Tiwari', 'Rao Narbir Singh', 'Zone 3'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 16, 'Nirvana Country', 'Sector 50', 'Geeta Bhatt', 'Rao Narbir Singh', 'Zone 4'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 17, 'Ardee City', 'Sector 52', 'Pradeep Joshi', 'Rao Narbir Singh', 'Zone 4'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 18, 'Golf Course Ext.', 'Sector 56', 'Priya Mehta', 'Rao Narbir Singh', 'Zone 4'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 19, 'Vatika Chowk', 'Sector 57', 'Harpal Singh', 'Rao Narbir Singh', 'Zone 4'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 20, 'Badshahpur', 'Sector 66', 'Sunita Devi', 'Umesh Agarwal', 'Zone 4'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 21, 'Subhash Chowk', 'Sector 63', 'Naresh Bansal', 'Umesh Agarwal', 'Zone 5'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 22, 'Southern Peripheral', 'Sector 67', 'Kavita Rana', 'Umesh Agarwal', 'Zone 5'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 23, 'Dwarka Expressway', 'Sector 84', 'Arun Tanwar', 'Umesh Agarwal', 'Zone 5'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 24, 'New Gurgaon', 'Sector 81', 'Pooja Malik', 'Satya Prakash', 'Zone 5'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 25, 'Manesar East', 'Sector 88', 'Vijay Sharma', 'Satya Prakash', 'Zone 5'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 26, 'IMT Manesar', 'Sector 89', 'Seema Rani', 'Satya Prakash', 'Zone 6'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 27, 'Pataudi Road', 'Sector 90', 'Dinesh Chand', 'Satya Prakash', 'Zone 6'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 28, 'Wazirabad', 'Sector 91', 'Reena Kumari', 'Bhavya Bishnoi', 'Zone 6'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 29, 'Basai', 'Sector 37', 'Surender Singh', 'Bhavya Bishnoi', 'Zone 6'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 30, 'Udyog Vihar', 'Sector 18', 'Sandeep Garg', 'Bhavya Bishnoi', 'Zone 6'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 31, 'Chakkarpur', 'Sector 31', 'Meena Kumari', 'Vinod Gupta', 'Zone 7'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 32, 'Nathupur', 'Sector 24', 'Rohit Phogat', 'Vinod Gupta', 'Zone 7'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 33, 'Dundahera', 'Sector 20', 'Bhupender Kaur', 'Neeraj Sharma', 'Zone 7'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 34, 'Jharsa', 'Sector 39', 'Devender Sehrawat', 'Mukesh Sharma', 'Zone 7'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 35, 'Carterpuri', 'Sector 7', 'Kamla Devi', 'Neeraj Sharma', 'Zone 7');

-- ============================================
-- ACCOUNTABILITY CHAIN (4 per ward = 140 rows)
-- ============================================
DO $$
DECLARE
  w RECORD;
  city_uuid uuid;
BEGIN
  SELECT id INTO city_uuid FROM cities WHERE slug = 'gurugram';
  FOR w IN SELECT id, number FROM wards WHERE city_id = city_uuid ORDER BY number LOOP
    INSERT INTO accountability_chain (city_id, ward_id, role, name, description, sort_order) VALUES
      (city_uuid, w.id, 'municipal_corporation', 'MCG Gurugram', 'Reports to Haryana State Government', 1),
      (city_uuid, w.id, 'commissioner', 'Sh. P.C. Meena (IAS)', 'Commissioner — City Head, top of chain', 2),
      (city_uuid, w.id, 'additional_commissioner', 'Sh. R.K. Yadav', 'Additional Commissioner — Zone oversight', 3),
      (city_uuid, w.id, 'jhi', 'JHI Ward ' || w.number, 'Junior Health Inspector — Frontline ward officer', 4);
  END LOOP;
END $$;

-- ============================================
-- 20 SAMPLE ISSUES (spread across wards)
-- ============================================
INSERT INTO issues (city_id, type, severity, status, description, latitude, longitude, address, ward_id, upvotes, created_at) VALUES
-- Pothole issues
((SELECT id FROM cities WHERE slug = 'gurugram'), 'pothole', 'critical', 'open', 'Large pothole near main market entrance causing traffic jams daily.', 28.4530, 77.0280, 'Sector 14, Near Main Market', (SELECT id FROM wards WHERE number = 5 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 47, now() - interval '2 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'pothole', 'medium', 'in_progress', 'Road surface deteriorated along bus route, patchwork needed.', 28.4710, 77.0200, 'Sector 10, Bus Route Road', (SELECT id FROM wards WHERE number = 3 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 19, now() - interval '9 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'pothole', 'critical', 'open', 'Multiple potholes on highway service road causing accidents.', 28.3800, 77.0600, 'Sector 67, SPR Highway Service Road', (SELECT id FROM wards WHERE number = 22 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 103, now() - interval '1 day'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'pothole', 'low', 'resolved', 'Small crack on service lane near petrol pump, fixed by MCG.', 28.4400, 77.0300, 'Sector 29, Near Petrol Pump', (SELECT id FROM wards WHERE number = 8 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 8, now() - interval '12 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'pothole', 'critical', 'open', 'Dangerous crater-sized pothole on main chowk intersection.', 28.4100, 77.0500, 'Sector 56, Main Chowk', (SELECT id FROM wards WHERE number = 18 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 78, now() - interval '3 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'pothole', 'medium', 'open', 'Broken road near school zone, children at risk.', 28.4800, 77.0150, 'Sector 22, Near School', (SELECT id FROM wards WHERE number = 7 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 35, now() - interval '5 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'pothole', 'low', 'resolved', 'Minor road crack patched after complaints.', 28.4650, 77.0350, 'Sector 44, Internal Road', (SELECT id FROM wards WHERE number = 13 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 6, now() - interval '25 days'),

-- Garbage issues
((SELECT id FROM cities WHERE slug = 'gurugram'), 'garbage', 'medium', 'in_progress', 'Garbage pile overflowing near residential colony park.', 28.4550, 77.0250, 'Sector 14, Colony Park', (SELECT id FROM wards WHERE number = 5 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 31, now() - interval '5 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'garbage', 'critical', 'open', 'Construction debris dumped on footpath, blocking pedestrian access.', 28.4480, 77.0320, 'Sector 31, Main Footpath', (SELECT id FROM wards WHERE number = 31 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 62, now() - interval '3 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'garbage', 'critical', 'open', 'Illegal waste dumping near vacant plot, foul smell reported.', 28.4050, 77.0550, 'Sector 57, Near Vacant Plot', (SELECT id FROM wards WHERE number = 19 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 55, now() - interval '2 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'garbage', 'low', 'resolved', 'Old garbage bin replaced with new one by MCG team.', 28.4750, 77.0100, 'Sector 4, Market Area', (SELECT id FROM wards WHERE number = 2 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 5, now() - interval '15 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'garbage', 'critical', 'open', 'Market area waste not collected for a week, health hazard.', 28.4760, 77.0110, 'Sector 4, Old Market', (SELECT id FROM wards WHERE number = 2 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 56, now() - interval '2 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'garbage', 'medium', 'open', 'Overflowing bins in park, no collection for 3 days.', 28.4420, 77.0290, 'Leisure Valley Park, Sector 29', (SELECT id FROM wards WHERE number = 8 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 42, now() - interval '4 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'garbage', 'medium', 'in_progress', 'Vacant plot turned into illegal dump site by locals.', 28.4130, 77.0480, 'Sector 56, DLF Phase 5', (SELECT id FROM wards WHERE number = 18 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 29, now() - interval '6 days'),

-- Waterlogging issues
((SELECT id FROM cities WHERE slug = 'gurugram'), 'water', 'critical', 'open', 'Severe waterlogging blocking entire road after light rain.', 28.4080, 77.0520, 'Sector 56, Golf Course Extension Road', (SELECT id FROM wards WHERE number = 18 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 112, now() - interval '1 day'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'water', 'medium', 'in_progress', 'Drain overflow during monsoon near school zone.', 28.4820, 77.0180, 'Sector 22, Near School', (SELECT id FROM wards WHERE number = 7 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 25, now() - interval '7 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'water', 'medium', 'open', 'Stagnant water breeding mosquitoes near community center.', 28.4350, 77.0380, 'Sector 48, Community Center', (SELECT id FROM wards WHERE number = 15 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 38, now() - interval '4 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'water', 'critical', 'open', 'Underpass flooded, commuters stranded for hours.', 28.3820, 77.0580, 'Sector 67, Main Underpass', (SELECT id FROM wards WHERE number = 22 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 81, now() - interval '2 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'water', 'low', 'resolved', 'Minor drainage issue fixed after ward councillor intervention.', 28.4500, 77.0310, 'Sector 33, Near Park', (SELECT id FROM wards WHERE number = 11 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 3, now() - interval '20 days'),
((SELECT id FROM cities WHERE slug = 'gurugram'), 'water', 'medium', 'in_progress', 'Recurring waterlogging at traffic signal junction.', 28.4340, 77.0400, 'Sohna Road Junction, Sector 48', (SELECT id FROM wards WHERE number = 15 AND city_id = (SELECT id FROM cities WHERE slug = 'gurugram')), 33, now() - interval '5 days');
