-- Migration 023: Migrate legacy flat string array in products.variants to structured variant groups
-- Converts legacy size string arrays into a single "Ukuran" / "Size" group while preserving data.

UPDATE products
SET variants = JSON_ARRAY(
  JSON_OBJECT(
    'id', 'grp_ukuran',
    'name_id', 'Ukuran',
    'name_en', 'Size',
    'options', JSON_ARRAY(
      JSON_OBJECT('id', 'opt_1', 'label_id', 'Drum Liner 200 Liter', 'label_en', 'Drum Liner 200 Liter'),
      JSON_OBJECT('id', 'opt_2', 'label_id', 'Pallet Hood 120 x 120 cm', 'label_en', 'Pallet Hood 120 x 120 cm')
    )
  )
)
WHERE id = 10
  AND variants IS NOT NULL
  AND JSON_TYPE(variants) = 'ARRAY'
  AND JSON_LENGTH(variants) > 0
  AND JSON_TYPE(JSON_EXTRACT(variants, '$[0]')) = 'STRING';

UPDATE products
SET variants = JSON_ARRAY(
  JSON_OBJECT(
    'id', 'grp_ukuran',
    'name_id', 'Ukuran',
    'name_en', 'Size',
    'options', JSON_ARRAY(
      JSON_OBJECT('id', 'opt_1', 'label_id', '25 x 35 cm', 'label_en', '25 x 35 cm'),
      JSON_OBJECT('id', 'opt_2', 'label_id', '30 x 40 cm', 'label_en', '30 x 40 cm'),
      JSON_OBJECT('id', 'opt_3', 'label_id', '35 x 45 cm', 'label_en', '35 x 45 cm')
    )
  )
)
WHERE id = 92
  AND variants IS NOT NULL
  AND JSON_TYPE(variants) = 'ARRAY'
  AND JSON_LENGTH(variants) > 0
  AND JSON_TYPE(JSON_EXTRACT(variants, '$[0]')) = 'STRING';
