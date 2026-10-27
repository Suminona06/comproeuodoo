Status: ACTIVE | Terakhir diverifikasi: 2026-10-27 | Kode: controllers/public/postController.js, controllers/admin/postController.js, models/slugRedirectModel.js

# Tech Spec: Modul Berita & Publikasi (News & Articles)

## 1. Arsitektur & Komponen
Modul Berita mengelola artikel publikasi korporat melalui integrasi editor TinyMCE, sistem kategorisasi, pemrosesan gambar sampul otomatis, dan sistem penanganan pengalihan tautan otomatis (HTTP 301 Redirect).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/news` | `postController.index` | `seoMiddleware`, `i18nMiddleware` | Render portal berita & headline |
| `GET` | `/news/:slug` | `postController.detail` | `seoMiddleware`, `i18nMiddleware` | Render artikel detail / cek redirect 301 |
| `GET` | `/admin/posts` | `admin/postController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin','editor'])` | Daftar artikel admin |
| `POST` | `/admin/posts` | `admin/postController.store` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Simpan artikel baru |
| `POST` | `/admin/posts/:id` | `admin/postController.update` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Update artikel & catat slug 301 |
| `POST` | `/admin/posts/upload-image` | `admin/postController.uploadEditorImage` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Endpoint upload gambar TinyMCE |
| `GET/POST`| `/admin/post-categories` | `postCategoryController.*`| `requireAuth`, `roleMiddleware` | Kelola 3 kategori berita |

---

## 3. Skema Data Terkait

### A. Tabel `posts`
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `003_upgrade_v2_schema.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `category_id` | `INT` | NO | - | Foreign Key ke `post_categories.id` |
| `title_id` | `VARCHAR(255)` | NO | - | Judul artikel (ID) |
| `title_en` | `VARCHAR(255)` | YES | NULL | Judul artikel (EN) |
| `slug` | `VARCHAR(191)` | NO | - | Unique slug artikel |
| `excerpt_id` | `TEXT` | YES | NULL | Ringkasan singkat (ID) |
| `excerpt_en` | `TEXT` | YES | NULL | Ringkasan singkat (EN) |
| `content_id` | `LONGTEXT` | NO | - | Konten HTML artikel (ID) |
| `content_en` | `LONGTEXT` | YES | NULL | Konten HTML artikel (EN) |
| `cover_image` | `VARCHAR(500)` | YES | NULL | Gambar sampul utama |
| `status` | `ENUM('draft','published','archived')` | YES | `'draft'` | Status publikasi |
| `published_at`| `DATETIME` | YES | NULL | Tanggal resmi rilis publikasi |
| `meta_*`, `og_image`, `canonical_url`, `robots` | Berbagai | YES | - | Metadata SEO per artikel |

### B. Tabel `post_categories` & `slug_redirects`
- `post_categories`: `id`, `name_id`, `name_en`, `slug`, `type` (`news`, `press`, `blog`), `sort_order`.
- `slug_redirects`:
  *File Migrasi:* `database/migrations/004_revisi_admin_v1.sql`
  - `id` (INT PK Auto Inc)
  - `entity_type` (VARCHAR 50, mis. `'post'`)
  - `entity_id` (INT, id artikel terkait)
  - `old_slug` (VARCHAR 191)
  - `new_slug` (VARCHAR 191)
  - `created_at` (TIMESTAMP)

---

## 4. Alur Logika Custom Slug & Auto Redirect 301
1. Saat artikel diperbarui di `admin/postController.update`:
   - Jika `slug` baru berbeda dari `slug` lama dan artikel berstatus `published`, sistem memeriksa apakah riwayat redirect sudah ada.
   - Menyimpan entri baru ke tabel `slug_redirects (entity_type='post', entity_id, old_slug, new_slug)`.
   - Memperbarui rantai redirect lama agar menunjuk langsung ke `new_slug` untuk mencegah multi-hop redirect.
2. Saat permintaan publik tiba di `controllers/public/postController.detail`:
   - Sistem mencari artikel berdasarkan `slug`. Jika tidak ditemukan, sistem memeriksa `slugRedirectModel.findByOldSlug('post', slug)`.
   - Jika ditemukan, sistem langsung merespons dengan HTTP Status `301 Moved Permanently` ke URL `/news/${redirect.new_slug}`.

---

## 5. Keamanan & Sanitasi HTML
- Seluruh konten HTML dari TinyMCE disanitasi menggunakan `sanitize-html` di server sebelum disimpan ke database guna mencegah script injection (`<script>`, inline `onload`/`onerror`, dsb.).

---

## 6. Tata Letak Detail Artikel & Header Solid
- **Header Solid Putih:** Pada `/news/:slug`, modifier `.header-wrap--solid` mengunci bilah navbar dalam mode putih solid `var(--color-surface, #ffffff)` / `rgba(255, 255, 255, 0.96)` berbayangan `var(--shadow-1)` dengan border bawah `1px solid var(--border)`. Top bar berlatar solid hijau signature `var(--surface-dark-footer, #00573f)` selaras warna footer. Teks merek `.brand-name` dan hamburger bernuansa `var(--navy, #071f17)`, link navigasi `.nav-link` berwarna `var(--text-variant)`. Tidak masuk mode transparan di posisi scroll teratas.
- **Offset Vertikal Konten:** Kontainer utama `<main id="main-content">` atau seksi breadcrumb detail artikel menerima offset atas dinamis `padding-top: var(--header-actual-height, 92px)` (dihitung otomatis via JS saat load/resize dengan fallback CSS statis 92px desktop / 88px mobile), menjaga navigasi breadcrumb dan judul artikel tampil rapi, presisi, dan elegan persis di bawah batas navbar tanpa overlap.
