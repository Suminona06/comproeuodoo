-- Migration 011: Register address visibility toggles, WhatsApp rolling JSON, and calibrate hero banner overlay opacity (T-238)

-- 1. Register default settings for dual location address card visibility and multi-number WhatsApp rolling
INSERT IGNORE INTO settings (setting_key, setting_value)
VALUES
  ('office_card_visible', '1'),
  ('factory_card_visible', '1'),
  ('whatsapp_numbers_json', '[]');

-- 2. Adjust default column overlay opacity on page_hero_banners to light calibration (0.35)
ALTER TABLE page_hero_banners MODIFY COLUMN overlay_opacity DECIMAL(3,2) DEFAULT 0.35;

-- 3. Update existing seed records to light calibrated overlay opacity
UPDATE page_hero_banners 
SET overlay_opacity = 0.35 
WHERE page_key IN ('about', 'products', 'news', 'contact');

