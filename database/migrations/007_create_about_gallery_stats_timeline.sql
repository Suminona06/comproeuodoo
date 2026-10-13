-- Migration: 007_create_about_gallery_stats_timeline.sql
-- PT Euodoo - About Page Revision (Gallery, Stats, Timeline, and Settings)

CREATE TABLE IF NOT EXISTS about_gallery_slides (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL,
  category_id VARCHAR(100) DEFAULT '',
  category_en VARCHAR(100) DEFAULT '',
  title_id VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) DEFAULT '',
  subtitle_id VARCHAR(500) DEFAULT '',
  subtitle_en VARCHAR(500) DEFAULT '',
  sort_order INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gallery_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS about_stats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stat_value VARCHAR(50) NOT NULL,
  label_id VARCHAR(255) NOT NULL,
  label_en VARCHAR(255) DEFAULT '',
  sort_order INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stats_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS about_timeline (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  year_label_id VARCHAR(100) NOT NULL,
  year_label_en VARCHAR(100) DEFAULT '',
  title_id VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) DEFAULT '',
  description_id TEXT NULL,
  description_en TEXT NULL,
  sort_order INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_timeline_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (setting_key, setting_value)
VALUES
  ('about_gallery_kicker_id', 'Galeri Kami'),
  ('about_gallery_kicker_en', 'Our Gallery'),
  ('about_gallery_title_id', 'Di Dalam Operasional Kami'),
  ('about_gallery_title_en', 'Inside Our Operations'),
  ('about_gallery_body_id', 'Sepintas aktivitas produksi, lini ekstrusi film mutakhir, pengujian laboratorium, dan standar kebersihan manufaktur PT EUODOO.'),
  ('about_gallery_body_en', 'A glimpse of our daily manufacturing, modern blown film extrusion lines, laboratory QA, and clean industrial standards at PT EUODOO.'),
  ('about_story_kicker_id', 'Kisah Kami'),
  ('about_story_kicker_en', 'Our Story'),
  ('vision_image_url', ''),
  ('mission_image_url', '')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO about_gallery_slides (image_url, category_id, category_en, title_id, title_en, subtitle_id, subtitle_en, sort_order, is_active)
VALUES
  ('/images/hero-factory.jpg', 'FASILITAS MANUFAKTUR', 'MANUFACTURING PLANT', 'Lini Produksi & Pergudangan Modern', 'Modern Production Lines & Warehouse', 'Fasilitas terpadu berkapasitas tinggi di kawasan industri Bandung.', 'High-capacity integrated plant in Bandung industrial area.', 1, 1),
  ('/images/segment-industrial.jpg', 'TEKNOLOGI EKSTRUSI', 'EXTRUSION TECHNOLOGY', 'Ekstrusi Film Presisi Tinggi', 'High-Precision Blown Film Extrusion', 'Mesin ekstrusi multi-layer modern dengan toleransi ketebalan mikro yang presisi.', 'Modern multi-layer extrusion with tight micron thickness tolerance.', 2, 1),
  ('/images/segment-retail.jpg', 'PRODUK RITEL', 'RETAIL SOLUTIONS', 'Kemasan Kantong Plastik Ritel', 'Retail Plastic Bag Packaging Solutions', 'Pasokan terpercaya untuk jaringan ritel modern, supermarket, dan department store.', 'Reliable supplies for modern supermarkets and retail stores across Indonesia.', 3, 1),
  ('/images/segment-sustainability.jpg', 'INOVASI RAMAH LINGKUNGAN', 'ECO INNOVATION', 'Formulasi Degradable OXIUM', 'Certified OXIUM Degradable Formulas', 'Teknologi ramah lingkungan tersertifikasi SNI dan ASTM yang aman bagi tanah.', 'Certified degradable technology under official SNI and ASTM standards.', 4, 1),
  ('/images/segment-traditional.jpg', 'KEMITRAAN PASAR', 'MARKET PARTNERSHIP', 'Jaringan Grosir & Pasar Tradisional', 'Wholesale Hubs & Traditional Markets', 'Mendukung ribuan pedagang dan pelaku UMKM dengan pasokan kantong konsisten.', 'Supporting thousands of MSMEs and merchants with reliable supply.', 5, 1),
  ('/images/post-school-recycling.jpg', 'EDUKASI LINGKUNGAN', 'ECO EDUCATION', 'Kampanye Bijak Kelola Sampah', 'Responsible Plastic Usage Initiatives', 'Inisiatif sosialisasi dan edukasi pengelolaan sampah plastik sejak dini.', 'Promoting early recycling education and responsible plastic handling.', 6, 1),
  ('/images/post-eco-community.jpg', 'KEBERLANJUTAN', 'SUSTAINABILITY', 'Inisiatif Komunitas Hijau', 'Green Community Collaboration', 'Komitmen bersama mitra menjaga kelestarian lingkungan bebas mikroplastik.', 'Collaborative community programs fostering a sustainable circular ecosystem.', 7, 1);

INSERT INTO about_stats (stat_value, label_id, label_en, sort_order, is_active)
VALUES
  ('30+', 'Tahun Pengalaman Manufaktur', 'Years Manufacturing Experience', 1, 1),
  ('5', 'Merek Terdaftar & Terpercaya', 'Registered Trusted Brands', 2, 1),
  ('4', 'Sertifikasi Mutu & Lingkungan', 'Official Quality Certifications', 3, 1),
  ('3', 'Segmen Pasar Nasional', 'National Market Segments', 4, 1);

INSERT INTO about_timeline (year_label_id, year_label_en, title_id, title_en, description_id, description_en, sort_order, is_active)
VALUES
  ('1990 — Awal Berdiri', '1990 — Inception', 'Kelahiran PT Sahabat Baru & PT Pelita Baru', 'Founding of Sahabat Baru & Pelita Baru', 'Bermula dari industri rumahan manufaktur plastik di Bandung dengan komitmen menghadirkan produk berkualitas dan harga terjangkau.', 'Started as a plastic manufacturing operation in Bandung committed to quality and fair value.', 1, 1),
  ('2000-an — Ekspansi', '2000s — Expansion', 'Modernisasi Fasilitas & Kantor Jakarta', 'Plant Modernization & Jakarta Office', 'Ekspansi kapasitas mesin converting otomatis dan pembukaan kantor pemasaran di Palmerah Jakarta untuk memperluas jangkauan ke ritel modern.', 'Expanded automated converting capacity and established Jakarta sales office for modern retail.', 2, 1),
  ('Era Inovasi Hijau', 'Green Innovation Era', 'Pionir Plastik Ramah Lingkungan OXIUM', 'Pioneering OXIUM Degradable Tech', 'Menjadi pionir penerapan aditif ramah lingkungan OXIUM berstandar SNI 7188.7:2011 dan US ASTM D6954 untuk mengurangi dampak sampah plastik.', 'Pioneered OXIUM degradable additives compliant with SNI 7188.7:2011 and ASTM D6954 standards.', 3, 1),
  ('Kini — Keberlanjutan', 'Present — Sustainable Reach', 'Standar Mutu Berkelanjutan & Skala Nasional', 'Sustainable Quality & National Scale', 'Menyatukan seluruh operasional di bawah PT EUODOO dengan kapasitas ribuan ton per tahun melayani sektor ritel, industri, dan pasar tradisional.', 'Consolidating all operations under PT EUODOO, serving retail, industrial, and traditional markets nationwide.', 4, 1);
