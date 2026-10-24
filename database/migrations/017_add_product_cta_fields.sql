-- Migration 017: Add cta_text_id and cta_text_en to products table
ALTER TABLE products
  ADD COLUMN cta_text_id VARCHAR(100) NULL AFTER description_en,
  ADD COLUMN cta_text_en VARCHAR(100) NULL AFTER cta_text_id;
