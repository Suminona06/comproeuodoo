-- Migration 022: Add show_description_tab toggle to products table
ALTER TABLE products
  ADD COLUMN show_description_tab TINYINT(1) NOT NULL DEFAULT 0 AFTER cta_text_en;
