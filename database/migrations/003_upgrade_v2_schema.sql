-- ========================================================
-- MIGRATION: 003_upgrade_v2_schema.sql
-- PT Euodoo - Database Schema v2.0 (12 Unified Tables)
-- PRD & Tech Spec v2.0 Architecture
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. UPGRADE USERS TABLE
-- Roles: superadmin, admin, editor (transition from super_admin)
-- --------------------------------------------------------
ALTER TABLE users 
  MODIFY COLUMN role ENUM('super_admin', 'superadmin', 'admin', 'editor') DEFAULT 'admin';

UPDATE users SET role = 'superadmin' WHERE role = 'super_admin';

ALTER TABLE users 
  MODIFY COLUMN role ENUM('superadmin', 'admin', 'editor') DEFAULT 'admin';

ALTER TABLE users 
  MODIFY COLUMN failed_attempts INT DEFAULT 0;

ALTER TABLE users 
  MODIFY COLUMN locked_until DATETIME NULL DEFAULT NULL;

-- --------------------------------------------------------
-- 2. CREATE PRODUCT_CATEGORIES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_id VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description_id TEXT NULL,
  description_en TEXT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_categories_slug (slug),
  INDEX idx_product_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing categories into product_categories if categories exists
INSERT INTO product_categories (id, name_id, name_en, slug, description_id, description_en, sort_order, created_at, updated_at)
SELECT id, name_id, name_en, slug, description_id, description_en, sort_order, created_at, updated_at
FROM categories
ON DUPLICATE KEY UPDATE 
  name_id = VALUES(name_id),
  name_en = VALUES(name_en),
  slug = VALUES(slug),
  description_id = VALUES(description_id),
  description_en = VALUES(description_en),
  sort_order = VALUES(sort_order);

-- --------------------------------------------------------
-- 3. UPGRADE PRODUCTS TABLE
-- Add status (draft, published, archived), SEO metadata, JSON-LD, and foreign key to product_categories
-- --------------------------------------------------------
ALTER TABLE products DROP FOREIGN KEY fk_products_category;

ALTER TABLE products
  ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'published' AFTER gallery_images;

ALTER TABLE products
  ADD COLUMN meta_title_id VARCHAR(255) NULL AFTER status;

ALTER TABLE products
  ADD COLUMN meta_title_en VARCHAR(255) NULL AFTER meta_title_id;

ALTER TABLE products
  ADD COLUMN meta_description_id TEXT NULL AFTER meta_title_en;

ALTER TABLE products
  ADD COLUMN meta_description_en TEXT NULL AFTER meta_description_id;

ALTER TABLE products
  ADD COLUMN og_image VARCHAR(500) NULL AFTER meta_description_en;

ALTER TABLE products
  ADD COLUMN canonical_url VARCHAR(500) NULL AFTER og_image;

ALTER TABLE products
  ADD COLUMN robots ENUM('index', 'noindex') DEFAULT 'index' AFTER canonical_url;

ALTER TABLE products
  ADD COLUMN jsonld JSON NULL AFTER robots;

UPDATE products SET status = IF(is_active = 1, 'published', 'draft');

ALTER TABLE products DROP INDEX idx_products_status_category;

ALTER TABLE products
  ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES product_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE products
  ADD INDEX idx_products_status_category (status, category_id);

-- --------------------------------------------------------
-- 4. CREATE PRODUCT_VARIANTS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name_id VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NULL,
  sku VARCHAR(100) NULL,
  specs JSON NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_variants_product (product_id),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. CREATE POST_CATEGORIES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_id VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  type ENUM('berita', 'blog') DEFAULT 'berita',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_post_categories_slug (slug),
  INDEX idx_post_categories_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. UPGRADE POSTS TABLE
-- Add category_id, type (berita, pers, blog), is_headline, scheduled_at, SEO metadata
-- --------------------------------------------------------
ALTER TABLE posts
  ADD COLUMN category_id INT NULL DEFAULT NULL AFTER id;

ALTER TABLE posts
  ADD COLUMN type ENUM('berita', 'pers', 'blog') DEFAULT 'berita' AFTER category_id;

ALTER TABLE posts
  MODIFY COLUMN status ENUM('draft', 'scheduled', 'published') DEFAULT 'draft';

ALTER TABLE posts
  ADD COLUMN is_headline TINYINT(1) DEFAULT 0 AFTER cover_image;

ALTER TABLE posts
  ADD COLUMN scheduled_at DATETIME NULL DEFAULT NULL AFTER published_at;

ALTER TABLE posts
  ADD COLUMN meta_title_id VARCHAR(255) NULL AFTER scheduled_at;

ALTER TABLE posts
  ADD COLUMN meta_title_en VARCHAR(255) NULL AFTER meta_title_id;

ALTER TABLE posts
  ADD COLUMN meta_description_id TEXT NULL AFTER meta_title_en;

ALTER TABLE posts
  ADD COLUMN meta_description_en TEXT NULL AFTER meta_description_id;

ALTER TABLE posts
  ADD COLUMN og_image VARCHAR(500) NULL AFTER meta_description_en;

ALTER TABLE posts
  ADD COLUMN canonical_url VARCHAR(500) NULL AFTER og_image;

ALTER TABLE posts
  ADD COLUMN robots ENUM('index', 'noindex') DEFAULT 'index' AFTER canonical_url;

ALTER TABLE posts
  ADD COLUMN jsonld JSON NULL AFTER robots;

ALTER TABLE posts
  ADD CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES post_categories (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE posts
  ADD INDEX idx_posts_type_status_published (type, status, published_at);

ALTER TABLE posts
  ADD INDEX idx_posts_category (category_id);

ALTER TABLE posts
  ADD INDEX idx_posts_headline (is_headline, status);

-- --------------------------------------------------------
-- 7. UPGRADE BANNERS TABLE
-- Add support for left caption and single CTA (dwibahasa)
-- --------------------------------------------------------
ALTER TABLE banners
  ADD COLUMN caption_id TEXT NULL AFTER subtitle_en;

ALTER TABLE banners
  ADD COLUMN caption_en TEXT NULL AFTER caption_id;

ALTER TABLE banners
  ADD COLUMN cta_text_id VARCHAR(100) NULL AFTER link_url;

ALTER TABLE banners
  ADD COLUMN cta_text_en VARCHAR(100) NULL AFTER cta_text_id;

ALTER TABLE banners
  ADD COLUMN cta_url VARCHAR(500) NULL AFTER cta_text_en;

UPDATE banners 
SET 
  caption_id = COALESCE(subtitle_id, title_id),
  caption_en = COALESCE(subtitle_en, title_en),
  cta_url = link_url,
  cta_text_id = 'Hubungi Kami',
  cta_text_en = 'Contact Us'
WHERE caption_id IS NULL;

-- --------------------------------------------------------
-- 8. CREATE BRANDS TABLE (Merek Terdaftar)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  logo_url VARCHAR(500) NOT NULL,
  description_id TEXT NULL,
  description_en TEXT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_brands_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. CREATE PAGES TABLE (Halaman Statis: About Us, dsb)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  title_id VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NULL,
  content_id LONGTEXT NULL,
  content_en LONGTEXT NULL,
  hero_image VARCHAR(500) NULL,
  meta_title_id VARCHAR(255) NULL,
  meta_title_en VARCHAR(255) NULL,
  meta_description_id TEXT NULL,
  meta_description_en TEXT NULL,
  og_image VARCHAR(500) NULL,
  canonical_url VARCHAR(500) NULL,
  robots ENUM('index', 'noindex') DEFAULT 'index',
  jsonld JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. UPGRADE LEADS TO INQUIRIES TABLE
-- --------------------------------------------------------
RENAME TABLE leads TO inquiries;

ALTER TABLE inquiries
  DROP FOREIGN KEY fk_leads_product;

ALTER TABLE inquiries
  ADD COLUMN source ENUM('contact_form', 'wa_product') DEFAULT 'contact_form' AFTER message;

ALTER TABLE inquiries
  MODIFY COLUMN status VARCHAR(50) DEFAULT 'baru';

UPDATE inquiries SET status = 'dibaca' WHERE status = 'diproses';
UPDATE inquiries SET status = 'ditindaklanjuti' WHERE status IN ('selesai', 'ditolak');
UPDATE inquiries SET status = 'baru' WHERE status NOT IN ('baru', 'dibaca', 'ditindaklanjuti') OR status IS NULL;

ALTER TABLE inquiries
  MODIFY COLUMN status ENUM('baru', 'dibaca', 'ditindaklanjuti') DEFAULT 'baru';

ALTER TABLE inquiries
  ADD CONSTRAINT fk_inquiries_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE inquiries
  ADD INDEX idx_inquiries_status (status, created_at);

-- --------------------------------------------------------
-- 11. CREATE MEDIA TABLE (Media Library Terpusat)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT UNSIGNED DEFAULT 0,
  storage_driver ENUM('local', 's3') DEFAULT 'local',
  alt_text VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_media_mime (mime_type),
  INDEX idx_media_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
