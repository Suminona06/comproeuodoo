-- Migration 013: Add is_active and image_url to product_categories table
ALTER TABLE product_categories
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER sort_order,
  ADD COLUMN image_url VARCHAR(500) NULL AFTER description_en;

ALTER TABLE product_categories
  ADD INDEX idx_product_categories_is_active (is_active);
