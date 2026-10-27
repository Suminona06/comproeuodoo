-- Migration 016: Drop unused legacy columns material_specs and technical_specs from products
ALTER TABLE products
  DROP COLUMN material_specs,
  DROP COLUMN technical_specs;
