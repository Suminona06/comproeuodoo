-- ========================================================
-- MIGRATION: 001_create_initial_schema.sql
-- PT Euodoo - Website Company Profile & CMS
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role ENUM('super_admin', 'admin') DEFAULT 'admin',
  failed_attempts INT DEFAULT 0,
  locked_until DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BANNERS TABLE
CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_id VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NULL,
  subtitle_id TEXT NULL,
  subtitle_en TEXT NULL,
  media_type ENUM('image', 'video') DEFAULT 'image',
  file_url VARCHAR(500) NOT NULL,
  poster_url VARCHAR(500) NULL,
  link_url VARCHAR(500) NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_banners_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_id VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description_id TEXT NULL,
  description_en TEXT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name_id VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description_id TEXT NULL,
  description_en TEXT NULL,
  material_specs JSON NULL,
  technical_specs JSON NULL,
  main_image VARCHAR(500) NULL,
  gallery_images JSON NULL,
  is_featured TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_slug (slug),
  INDEX idx_products_status_category (is_active, category_id),
  INDEX idx_products_featured (is_featured),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. CAPABILITIES TABLE
CREATE TABLE IF NOT EXISTS capabilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_id VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  machine_type VARCHAR(150) NOT NULL,
  capacity VARCHAR(150) NULL,
  description_id TEXT NULL,
  description_en TEXT NULL,
  image_url VARCHAR(500) NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_capabilities_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. POSTS TABLE
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title_id VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  content_id LONGTEXT NULL,
  content_en LONGTEXT NULL,
  excerpt_id TEXT NULL,
  excerpt_en TEXT NULL,
  cover_image VARCHAR(500) NULL,
  status ENUM('draft', 'published') DEFAULT 'draft',
  published_at DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_posts_slug (slug),
  INDEX idx_posts_status_published (status, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('inquiry', 'partnership', 'general') DEFAULT 'inquiry',
  name VARCHAR(150) NOT NULL,
  company VARCHAR(200) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  product_id INT NULL DEFAULT NULL,
  quantity VARCHAR(100) NULL,
  message TEXT NOT NULL,
  status ENUM('baru', 'diproses', 'selesai', 'ditolak') DEFAULT 'baru',
  admin_notes TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_leads_status_type (status, type, created_at),
  INDEX idx_leads_created (created_at),
  CONSTRAINT fk_leads_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SETTINGS TABLE (Key-Value Configuration)
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
