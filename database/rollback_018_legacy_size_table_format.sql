-- Rollback Migration 018: Restore legacy array format for products 92, 215, 218
-- Safe rollback: only updates if table is currently in dynamic columns format.

UPDATE products
SET size_table = '[{"bahan": "HDPE + Oxium", "lebar": "30 cm", "width": "30 cm", "length": "40 cm", "panjang": "40 cm", "capacity": "5 kg", "material": "HDPE + Oxium", "kapasitas": "5 kg", "thickness": "40 mikron", "kode_produk": "SL-3040", "product_code": "SL-3040", "tebal_micron": "40 mikron"}, {"bahan": "HDPE + Oxium", "lebar": "35 cm", "width": "35 cm", "length": "45 cm", "panjang": "45 cm", "capacity": "8 kg", "material": "HDPE + Oxium", "kapasitas": "8 kg", "thickness": "45 mikron", "kode_produk": "SL-3545", "product_code": "SL-3545", "tebal_micron": "45 mikron"}, {"bahan": "HDPE + Oxium", "lebar": "40 cm", "width": "40 cm", "length": "50 cm", "panjang": "50 cm", "capacity": "12 kg", "material": "HDPE + Oxium", "kapasitas": "12 kg", "thickness": "50 mikron", "kode_produk": "SL-4050", "product_code": "SL-4050", "tebal_micron": "50 mikron"}]'
WHERE id = 92 AND JSON_EXTRACT(size_table, '$.columns') IS NOT NULL;

UPDATE products
SET size_table = '[{"bahan": "HDPE", "lebar": "20 cm", "width": "20 cm", "length": "30 cm", "panjang": "30 cm", "capacity": "3 kg", "material": "HDPE", "kapasitas": "3 kg", "thickness": "40 micron", "kode_produk": "TP-01", "product_code": "TP-01", "tebal_micron": "40 micron"}, {"bahan": "HDPE", "lebar": "30 cm", "width": "30 cm", "length": "40 cm", "panjang": "40 cm", "capacity": "6 kg", "material": "HDPE", "kapasitas": "6 kg", "thickness": "50 micron", "kode_produk": "TP-02", "product_code": "TP-02", "tebal_micron": "50 micron"}]'
WHERE id = 215 AND JSON_EXTRACT(size_table, '$.columns') IS NOT NULL;

UPDATE products
SET size_table = '[{"bahan": "HDPE Virgin", "lebar": "50 cm", "width": "50 cm", "length": "60 cm", "panjang": "60 cm", "capacity": "12 kg", "material": "HDPE Virgin", "kapasitas": "12 kg", "thickness": "50 mic", "kode_produk": "EU-UPD", "product_code": "EU-UPD", "tebal_micron": "50 mic"}]'
WHERE id = 218 AND JSON_EXTRACT(size_table, '$.columns') IS NOT NULL;

DELETE FROM migrations WHERE migration_name = '018_migrate_legacy_size_table_format.sql';
