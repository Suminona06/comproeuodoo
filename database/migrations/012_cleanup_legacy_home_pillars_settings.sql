-- Migration: 012_cleanup_legacy_home_pillars_settings.sql
-- Description: Clean up deprecated home_pillars_* settings keys replaced by home_wcu_* in Homepage Major Update v1 (Keputusan Terkunci 5 Opsi B)

DELETE FROM settings WHERE setting_key IN (
  'home_pillars_title_id',
  'home_pillars_title_en',
  'home_pillars_subtitle_id',
  'home_pillars_subtitle_en',
  'home_pillars_is_active',
  'home_pillars_json'
);
