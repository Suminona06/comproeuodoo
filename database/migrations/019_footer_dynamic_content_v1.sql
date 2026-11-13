-- Migrasi 019: Seed default deskripsi footer dinamis & maksimal 4 tautan menu footer kanan
-- Menggunakan INSERT IGNORE agar idempoten dan tidak menimpa data CMS eksisting

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
(
  'footer_desc_id',
  'PT. EUODOO adalah perusahaan manufaktur dan perdagangan kantong plastik HDPE dan LLDPE bersertifikasi ramah lingkungan. Didirikan tahun 1990, kami melayani retail modern, sektor industri, dan pasar tradisional dari fasilitas produksi di Bandung, Jawa Barat.'
),
(
  'footer_desc_en',
  'PT. EUODOO is a manufacturing and trading enterprise of eco-certified HDPE and LLDPE plastic bags. Established in 1990, we supply modern retail chains, industrial sectors, and traditional wholesale markets from our production plant in Bandung, West Java.'
),
(
  'footer_nav_links_json',
  '[{"label_id":"Produk Retail & Industri","label_en":"Retail & Industrial Products","url":"/products"},{"label_id":"Tentang PT. EUODOO","label_en":"About PT. EUODOO","url":"/about"},{"label_id":"Sertifikasi Lingkungan","label_en":"Environmental Certifications","url":"/about#sertifikasi"},{"label_id":"Merk PB & Berkah","label_en":"Brands PB & Berkah","url":"/products"}]'
);

