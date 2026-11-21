-- Migration 024: Add selected_variants JSON column to inquiries table for RFQ variant tracking
ALTER TABLE inquiries
  ADD COLUMN selected_variants JSON NULL AFTER product_id;
