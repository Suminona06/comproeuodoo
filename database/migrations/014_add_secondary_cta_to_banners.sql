-- Migration 014: Tambah kolom tombol kedua (secondary CTA) ke tabel banners
ALTER TABLE banners
  ADD COLUMN cta_secondary_text_id VARCHAR(100) NULL AFTER cta_url,
  ADD COLUMN cta_secondary_text_en VARCHAR(100) NULL AFTER cta_secondary_text_id,
  ADD COLUMN cta_secondary_url VARCHAR(500) NULL AFTER cta_secondary_text_en;
