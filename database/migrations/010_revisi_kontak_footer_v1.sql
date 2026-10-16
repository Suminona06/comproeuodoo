-- Migration: 010_revisi_kontak_footer_v1.sql
-- PT Euodoo: Field Fax & Email Dual Lokasi (T-148)

INSERT INTO settings (setting_key, setting_value) VALUES
  ('office_email', 'info@euodoo.com'),
  ('factory_fax', ''),
  ('factory_email', '')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
