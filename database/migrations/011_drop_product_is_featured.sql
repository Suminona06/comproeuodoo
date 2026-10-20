-- Migration 011: Drop is_featured column from products table (T-177)
-- Homepage now uses 4 primary category panels instead of individual featured product flags.

ALTER TABLE products DROP COLUMN is_featured;
