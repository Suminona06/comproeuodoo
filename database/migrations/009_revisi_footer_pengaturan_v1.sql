-- Migration: 009_revisi_footer_pengaturan_v1.sql
-- PT Euodoo: Standarisasi Kunci Media Sosial dan Default Data Lokasi Tunggal (T-142, T-143)

INSERT INTO settings (setting_key, setting_value)
SELECT 'social_linkedin_url', setting_value FROM settings WHERE setting_key = 'linkedin_url' AND setting_value IS NOT NULL AND setting_value != ''
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO settings (setting_key, setting_value)
SELECT 'social_instagram_url', setting_value FROM settings WHERE setting_key = 'instagram_url' AND setting_value IS NOT NULL AND setting_value != ''
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO settings (setting_key, setting_value)
SELECT 'social_facebook_url', setting_value FROM settings WHERE setting_key = 'facebook_url' AND setting_value IS NOT NULL AND setting_value != ''
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO settings (setting_key, setting_value)
SELECT 'social_youtube_url', setting_value FROM settings WHERE setting_key = 'youtube_url' AND setting_value IS NOT NULL AND setting_value != ''
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO settings (setting_key, setting_value) VALUES
  ('office_name_id', 'Kantor Pusat (Jakarta)'),
  ('office_name_en', 'Head Office (Jakarta)'),
  ('office_address', 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02-07, Jakarta Pusat 10270'),
  ('office_phone', '(021) 53668626'),
  ('company_phone', '(021) 53668626'),
  ('office_fax', '+6221-53668648'),
  ('factory_name_id', 'Pabrik Manufaktur (Bandung)'),
  ('factory_name_en', 'Manufacturing Plant (Bandung)'),
  ('factory_address', 'Jl. Paralon II No. 21 Cijerah, Bandung 40214'),
  ('factory_phone', '(022) 6012519'),
  ('factory_working_hours_id', 'Senin - Jumat: 08.00 - 17.00 WIB | Sabtu: 08.00 - 13.00 WIB'),
  ('factory_working_hours_en', 'Monday - Friday: 08:00 - 17:00 WIB | Saturday: 08:00 - 13:00 WIB'),
  ('social_linkedin_visible', '1'),
  ('social_instagram_visible', '1'),
  ('social_facebook_visible', '1'),
  ('social_youtube_visible', '1')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
