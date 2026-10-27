# ARSIP: Skema Database & Model Usang (Deprecated)
**Sumber Asli:** `2-TECH-SPEC.md` & Database MySQL  
**Tanggal Diarsipkan:** 2026-10-21  

---

## 1. Tabel Legacy `categories` (Skema Awal v1)
Digantikan sepenuhnya oleh tabel `product_categories` sejak migrasi `003_upgrade_v2_schema.sql`.
```sql
-- DEPRECATED: Jangan gunakan tabel ini untuk fitur baru
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_id VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description_id TEXT NULL,
  description_en TEXT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
*Tabel aktif tunggal resmi:* `product_categories` (memiliki kolom `image_url` dan `is_active` via migrasi `013`).

---

## 2. Tabel Legacy `pages` (Skema v1/v2)
Tabel ini dibuat pada skema awal namun tidak digunakan oleh backend modern. Konten halaman statis Tentang Kami dikelola langsung melalui key-value tabel `settings` dan tabel relasional `about_gallery_slides`, `about_stats`, serta `about_timeline`.
```sql
-- DEPRECATED: Tidak pernah di-query oleh pageController.js maupun aboutController.js
CREATE TABLE pages (
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
  robots ENUM('index','noindex') DEFAULT 'index',
  jsonld JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 3. Model Legacy `leadModel.js` & Tabel `leads`
Pada skema awal, lead dicatat ke tabel `leads`. Pada skema v2, seluruh pencatatan formulir masuk ke tabel resmi `inquiries` via `inquiryModel.js`. File `leadModel.js` adalah peninggalan kode lama yang menghasilkan warning error di log jika dipanggil.
*Tabel aktif tunggal resmi:* `inquiries`.

---

## 4. Kolom `is_featured` pada Tabel `products`
Dihapus permanen dari skema MySQL via migrasi `011_drop_product_is_featured.sql`:
```sql
ALTER TABLE products DROP COLUMN is_featured;
```

---

## 5. Kunci Pengaturan Legacy `home_pillars_*`
Dibersihkan permanen dari tabel `settings` via migrasi `012_cleanup_legacy_home_pillars_settings.sql`:
- `home_pillars_title_id`, `home_pillars_title_en`
- `home_pillars_subtitle_id`, `home_pillars_subtitle_en`
- `home_pillars_is_active`, `home_pillars_json`
Digantikan oleh rangkaian kunci `home_wcu_*` (*Why Choose Us*).
