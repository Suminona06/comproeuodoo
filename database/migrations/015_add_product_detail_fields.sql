-- Migration 015: Add short description, variants, and size table fields to products
ALTER TABLE products
  ADD COLUMN short_description_id VARCHAR(500) NULL AFTER slug,
  ADD COLUMN short_description_en VARCHAR(500) NULL AFTER short_description_id,
  ADD COLUMN variants JSON NULL AFTER technical_specs,
  ADD COLUMN size_table JSON NULL AFTER variants;
