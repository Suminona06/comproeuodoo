-- Migration: 004_revisi_admin_v1.sql
-- Description: Tabel slug_redirects (Item 6), page_hero_banners (Item 8), dan default settings (Item 3, 4, 5)

-- 1. Tabel Riwayat Redirect Slug Artikel (Item 6)
CREATE TABLE IF NOT EXISTS slug_redirects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'post',
  entity_id INT NOT NULL,
  old_slug VARCHAR(191) NOT NULL,
  new_slug VARCHAR(191) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug_redirects_lookup (entity_type, old_slug),
  INDEX idx_slug_redirects_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Hero Banner Khusus Per Halaman Publik (Item 8)
CREATE TABLE IF NOT EXISTS page_hero_banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_key VARCHAR(50) NOT NULL UNIQUE,
  title_id VARCHAR(255) NULL,
  title_en VARCHAR(255) NULL,
  subtitle_id TEXT NULL,
  subtitle_en TEXT NULL,
  image_url VARCHAR(500) NULL,
  overlay_opacity DECIMAL(3,2) DEFAULT 0.60,
  cta_text_id VARCHAR(100) NULL,
  cta_text_en VARCHAR(100) NULL,
  cta_url VARCHAR(500) NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page_hero_key (page_key, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Default untuk 4 Halaman (Item 8)
INSERT INTO page_hero_banners (page_key, title_id, title_en, subtitle_id, subtitle_en, image_url, overlay_opacity)
VALUES
  ('about', 'Tentang PT Euodoo', 'About PT Euodoo', 'Perjalanan dedikasi manufaktur plastik ramah lingkungan terpercaya sejak 1990.', 'A dedicated journey in eco-friendly plastic manufacturing since 1990.', '/images/hero-factory-precision.webp', 0.65),
  ('news', 'Berita & Wawasan Industri', 'News & Industry Insights', 'Pembaruan terkini inovasi kemasan, keberlanjutan lingkungan, dan kegiatan korporasi.', 'Latest updates on packaging innovation, environmental sustainability, and corporate activities.', '/images/hero-factory.jpg', 0.60),
  ('products', 'Katalog Produk Kemasan Plastik', 'Plastic Packaging Product Catalog', 'Rangkaian solusi kantong plastik HDPE & LLDPE berstandar SNI dan ramah lingkungan.', 'Comprehensive SNI-certified and eco-friendly HDPE & LLDPE plastic bag solutions.', '/images/hero-factory-precision.webp', 0.60),
  ('contact', 'Hubungi Kami & Permintaan Penawaran', 'Contact Us & Request a Quote', 'Konsultasikan spesifikasi kebutuhan cetakan dan kemasan plastik industri Anda bersama tim ahli kami.', 'Consult your industrial plastic molding and packaging specifications with our expert team.', '/images/hero-factory.jpg', 0.60)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 3. Default Settings Baru (Item 3, 4, 5)
INSERT INTO settings (setting_key, setting_value)
VALUES
  ('site_favicon', '/favicon.ico'),
  ('site_logo_header', '/images/brands/brand-euodoo.webp'),
  ('site_logo_footer', '/images/brands/brand-euodoo.webp'),
  ('contact_address_id', 'Kawasan Industri Cigondewah, Jl. Cigondewah Kaler No. 88, Kota Bandung, Jawa Barat 40214'),
  ('contact_address_en', 'Cigondewah Industrial Estate, Jl. Cigondewah Kaler No. 88, Bandung City, West Java 40214'),
  ('contact_email', 'info@euodoo.com'),
  ('contact_phone', '(021) 5366-0000'),
  ('contact_working_hours_id', 'Senin - Jumat: 08.00 - 17.00 WIB | Sabtu: 08.00 - 13.00 WIB'),
  ('contact_working_hours_en', 'Monday - Friday: 08:00 - 17:00 WIB | Saturday: 08:00 - 13:00 WIB'),
  ('contact_maps_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126748.56347862248!2d107.5731168!3d-6.9034443!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6398252477f%3A0x146a1f93d3e215ac!2sBandung%2C%20Bandung%20City%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid'),
  ('contact_form_title_id', 'Konsultasi & Permintaan Penawaran'),
  ('contact_form_title_en', 'Consultation & Request for Quotation'),
  ('contact_form_subtitle_id', 'Kirimkan rincian kebutuhan kantong plastik, ukuran kustom, dan volume pesanan bisnis Anda.'),
  ('contact_form_subtitle_en', 'Submit your plastic bag requirements, custom specifications, and corporate order volume.')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
