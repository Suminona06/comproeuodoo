# TECH SPEC: Arsitektur Sistem & Spesifikasi Teknis PT Euodoo

Dokumen ini adalah spesifikasi arsitektur teknis utama platform web company profile dan CMS PT Euodoo Presisi Indonesia. Rincian skema database, rute, komponen antarmuka, dan controller per domain fungsional didefinisikan pada modul-modul di [`tech/`](tech/).

---

## 1. Tech Stack & Fondasi Arsitektur

### Lingkungan Runtime & Server
- **Runtime:** Node.js (v20+ LTS / v24)
- **Framework Web:** Express.js (v4.x)
- **View Engine:** EJS (Embedded JavaScript) dengan arsitektur Server-Side Rendering (SSR)
- **Pustaka Pemrosesan Media:** Sharp (konversi gambar WebP, auto-rotate, resize)
- **Rich Text Editor:** TinyMCE (Self-hosted skin di `public/vendor/tinymce/`)
- **Animasi Antarmuka:** Anime.js v3 (transisi Bento Grid) & Vanilla CSS Transitions
- **CSS Styling:** Vanilla CSS terstruktur (`tokens.css`, `base.css`, `components.css`, `layout.css`, `admin.css`) tanpa TailwindCSS

### Database & Komunikasi Data
- **Database Engine:** MySQL 8.0 / MariaDB 10.5+
- **Database Client:** `mysql2/promise` dengan Connection Pool (`config/database.js`)
- **Format Karakter:** `utf8mb4` dengan collation `utf8mb4_unicode_ci`
- **Engine Tabel:** `InnoDB` untuk seluruh tabel
- **Sistem Migrasi:** Skrip SQL berurutan di `database/migrations/` yang dieksekusi via `database/migrate.js`

---

## 2. Standar Desain Visual & Token Warna

Sesuai hasil rebrand palet hijau (T-158 s/d T-168), platform menggunakan palet warna terstandarisasi. **Dilarang keras menuliskan nilai warna hex secara sembarangan di dokumen spek maupun kode antarmuka.** Seluruh implementasi WAJIB merujuk ke token resmi:
- **Dokumen Acuan:** [`Design/DESIGN.md`](../Design/DESIGN.md)
- **Berkas Token CSS:** [`public/css/tokens.css`](../public/css/tokens.css)
- **Token Kunci:**
  - Brand Primary: `var(--color-primary, #00755a)`
  - Brand Primary Dark: `var(--color-primary-dark, #00573f)`
  - Brand Primary Hover: `var(--color-primary-hover, #009476)`
  - Leaf Accent: `var(--color-leaf, #7cbe38)`
  - Surface Footer: `var(--surface-dark-footer, #00573f)`
  - Dual-Token Public Background: `var(--bg-base, #ffffff)` & `var(--bg-subtle, #f8fafc)`

---

## 3. Peta Modul Spesifikasi Teknis (Tech Spec)

Setiap domain fitur memiliki spesifikasi teknis mandiri yang memuat skema tabel final, endpoint rute, middleware, class prefix CSS, dan business logic:

| Modul | Rute Utama | Tabel Database Terkait | Prefix CSS Kunci | Dokumen Spesifikasi |
| :--- | :--- | :--- | :--- | :--- |
| **Public Home** | `GET /` | `banners`, `product_categories`, `brands`, `settings` | `.hero-slider`, `.hcat-*`, `.wcu-*`, `.sec-evidence`, `.brand-strip-*` | [tech/public-home.md](tech/public-home.md) |
| **Public About** | `GET /about` | `about_gallery_slides`, `about_stats`, `about_timeline`, `settings` | `.sec-gallery`, `.abt-gal-*`, `.value-card` | [tech/public-about.md](tech/public-about.md) |
| **Products & Capabilities** | `GET /products`, `GET /capabilities` | `product_categories`, `products`, `product_variants`, `capabilities` | `.prod-*`, `.cap-*` | [tech/products.md](tech/products.md) |
| **News & Articles** | `GET /news`, `/news/:slug` | `posts`, `post_categories`, `slug_redirects` | `.news-*` | [tech/news.md](tech/news.md) |
| **Contact, Footer & WA** | `GET/POST /contact`, `POST /leads` | `inquiries`, `settings` | `.cf-*`, `.site-footer`, `.wa-*` | [tech/contact-footer.md](tech/contact-footer.md) |
| **Admin CMS & Users** | `/admin/*`, `/admin/inquiries` | `users`, `inquiries` | `.admin-*`, `.badge-*` | [tech/admin-cms.md](tech/admin-cms.md) |
| **Media Library** | `/admin/media` | `media` | `.media-grid`, `.picker-modal` | [tech/media-library.md](tech/media-library.md) |
| **SEO & Security** | `/sitemap.xml`, `/robots.txt` | Seluruh entitas terpublikasi | Tag `<head>`, Schema JSON-LD | [tech/seo-security.md](tech/seo-security.md) |
| **Site Settings** | `/admin/settings` | `settings` | `.settings-tab`, `.form-input` | [tech/settings.md](tech/settings.md) |

---

## 4. Standar Middleware & Pipeline Permintaan

Setiap permintaan yang masuk melalui `app.js` melewati pipeline standar:
1. **Keamanan:** Helmet (HTTP headers), CORS, Cookie Parser dengan signing secret.
2. **Pencatatan Log:** Morgan HTTP request logger & Winston structured logger (`utils/logger.js`).
3. **Internasionalisasi (`i18nMiddleware.js`):** Membaca bahasa aktif (default `id`), memuat kamus JSON dari `locales/id.json` atau `locales/en.json`, dan menginjeksi fungsi pembantu `t()` ke template.
4. **Pengaturan Global (`settingsMiddleware.js`):** Menginjeksi seluruh konfigurasi aktif dari tabel `settings` ke `res.locals.settings`.
5. **SEO & Metadata (`seoMiddleware.js`):** Menghitung nilai kanonikal, meta title, deskripsi, Open Graph, dan skema JSON-LD untuk view yang sedang dirender.
6. **Penanganan Error Global (`errorHandler.js`):** Mengisolasi error runtime dan merender halaman 404 (`views/public/404.ejs`) atau 500 ramah pengguna.
