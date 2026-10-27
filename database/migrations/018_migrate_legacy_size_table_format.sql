-- Migration 018: Migrate legacy size table array format to dynamic columns object
-- Converts size_table for products 92, 215, 218 from legacy 6-key array to { columns, rows } schema.
-- Idempotent: Skipped if already migrated (JSON_EXTRACT(size_table, '$.columns') IS NOT NULL).

UPDATE products
SET size_table = JSON_OBJECT(
  'columns', JSON_ARRAY(
    JSON_OBJECT('id', 'col_1', 'label', 'Kode Produk'),
    JSON_OBJECT('id', 'col_2', 'label', 'Lebar'),
    JSON_OBJECT('id', 'col_3', 'label', 'Panjang'),
    JSON_OBJECT('id', 'col_4', 'label', 'Tebal (Micron)'),
    JSON_OBJECT('id', 'col_5', 'label', 'Kapasitas'),
    JSON_OBJECT('id', 'col_6', 'label', 'Bahan')
  ),
  'rows', JSON_ARRAY(
    JSON_OBJECT(
      'col_1', 'SL-3040',
      'col_2', '30 cm',
      'col_3', '40 cm',
      'col_4', '40 mikron',
      'col_5', '5 kg',
      'col_6', 'HDPE + Oxium'
    ),
    JSON_OBJECT(
      'col_1', 'SL-3545',
      'col_2', '35 cm',
      'col_3', '45 cm',
      'col_4', '45 mikron',
      'col_5', '8 kg',
      'col_6', 'HDPE + Oxium'
    ),
    JSON_OBJECT(
      'col_1', 'SL-4050',
      'col_2', '40 cm',
      'col_3', '50 cm',
      'col_4', '50 mikron',
      'col_5', '12 kg',
      'col_6', 'HDPE + Oxium'
    )
  )
)
WHERE id = 92
  AND size_table IS NOT NULL
  AND JSON_EXTRACT(size_table, '$.columns') IS NULL;

UPDATE products
SET size_table = JSON_OBJECT(
  'columns', JSON_ARRAY(
    JSON_OBJECT('id', 'col_1', 'label', 'Kode Produk'),
    JSON_OBJECT('id', 'col_2', 'label', 'Lebar'),
    JSON_OBJECT('id', 'col_3', 'label', 'Panjang'),
    JSON_OBJECT('id', 'col_4', 'label', 'Tebal (Micron)'),
    JSON_OBJECT('id', 'col_5', 'label', 'Kapasitas'),
    JSON_OBJECT('id', 'col_6', 'label', 'Bahan')
  ),
  'rows', JSON_ARRAY(
    JSON_OBJECT(
      'col_1', 'TP-01',
      'col_2', '20 cm',
      'col_3', '30 cm',
      'col_4', '40 micron',
      'col_5', '3 kg',
      'col_6', 'HDPE'
    ),
    JSON_OBJECT(
      'col_1', 'TP-02',
      'col_2', '30 cm',
      'col_3', '40 cm',
      'col_4', '50 micron',
      'col_5', '6 kg',
      'col_6', 'HDPE'
    )
  )
)
WHERE id = 215
  AND size_table IS NOT NULL
  AND JSON_EXTRACT(size_table, '$.columns') IS NULL;

UPDATE products
SET size_table = JSON_OBJECT(
  'columns', JSON_ARRAY(
    JSON_OBJECT('id', 'col_1', 'label', 'Kode Produk'),
    JSON_OBJECT('id', 'col_2', 'label', 'Lebar'),
    JSON_OBJECT('id', 'col_3', 'label', 'Panjang'),
    JSON_OBJECT('id', 'col_4', 'label', 'Tebal (Micron)'),
    JSON_OBJECT('id', 'col_5', 'label', 'Kapasitas'),
    JSON_OBJECT('id', 'col_6', 'label', 'Bahan')
  ),
  'rows', JSON_ARRAY(
    JSON_OBJECT(
      'col_1', 'EU-UPD',
      'col_2', '50 cm',
      'col_3', '60 cm',
      'col_4', '50 mic',
      'col_5', '12 kg',
      'col_6', 'HDPE Virgin'
    )
  )
)
WHERE id = 218
  AND size_table IS NOT NULL
  AND JSON_EXTRACT(size_table, '$.columns') IS NULL;
