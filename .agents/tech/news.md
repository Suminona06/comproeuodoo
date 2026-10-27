Status: ACTIVE | Terakhir diverifikasi: 2026-10-27 | Kode: controllers/public/postController.js, controllers/admin/postController.js, models/slugRedirectModel.js

# Tech Spec: Modul Berita & Publikasi (News & Articles)

## 1. Arsitektur & Komponen
Modul Berita mengelola artikel publikasi korporat melalui integrasi editor TinyMCE, sistem kategorisasi, pemrosesan gambar sampul otomatis, penanganan pengalihan tautan otomatis (HTTP 301 Redirect), dan penyajian data publik berbasis SSR serta asynchronous Fetch API.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/news` | `postController.index` | `seoMiddleware`, `i18nMiddleware` | Portal berita & headline; JSON jika fetch/ajax [PENDING T-231] |
| `GET` | `/news/:slug` | `postController.detail` | `seoMiddleware`, `i18nMiddleware` | Detail artikel G2 / cek redirect 301 [PENDING T-226, T-228] |
| `GET` | `/admin/posts` | `admin/postController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin','editor'])` | Daftar artikel admin |
| `POST` | `/admin/posts` | `admin/postController.store` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Simpan artikel baru |
| `POST` | `/admin/posts/:id` | `admin/postController.update` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Update artikel & catat slug 301 |
| `POST` | `/admin/posts/upload-image` | `admin/postController.uploadEditorImage` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Upload gambar TinyMCE |
| `GET/POST`| `/admin/post-categories` | `postCategoryController.*`| `requireAuth`, `roleMiddleware` | Kelola kategori berita |

---

## 3. Skema Data Terkait

### A. Tabel `posts`
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `003_upgrade_v2_schema.sql`
- Kolom: `id` (INT PK), `category_id` (INT FK), `title_id` / `title_en` (VARCHAR 255), `slug` (VARCHAR 191 UNIQUE), `excerpt_id` / `excerpt_en` (TEXT), `content_id` / `content_en` (LONGTEXT), `cover_image` (VARCHAR 500), `is_headline` (TINYINT(1) DEFAULT 0) [PENDING T-230], `status` (ENUM 'draft','published','archived'), `published_at` (DATETIME), `meta_*`, `og_image`, `canonical_url`, `robots`.

### B. Tabel `post_categories` & `slug_redirects`
- `post_categories`: `id`, `name_id`, `name_en`, `slug`, `type` (`news`, `press`, `blog`), `sort_order`.
- `slug_redirects`: `id`, `entity_type`, `entity_id`, `old_slug`, `new_slug`, `created_at`.

---

## 4. Alur Logika Custom Slug & Auto Redirect 301
1. Pada `admin/postController.update`: jika `slug` baru berbeda dari yang lama pada artikel `published`, simpan entri baru ke `slug_redirects` dan perbarui rantai redirect lama agar menunjuk langsung ke `new_slug`.
2. Pada `controllers/public/postController.detail`: jika artikel tidak ditemukan, cek `slugRedirectModel.findByOldSlug('post', slug)`. Jika ada, kirim respon HTTP `301 Moved Permanently` ke `/news/${redirect.new_slug}`.

---

## 5. Keamanan, Sanitasi & Validasi
- Konten HTML disanitasi menggunakan `sanitize-html` di server sebelum disimpan ke database.
- Query parameter (`type`, `category`, `search`, `page`) divalidasi whitelist di server [PENDING T-231].

---

## 6. Tata Letak Detail Artikel & Breadcrumb Mandiri [PENDING T-226, T-228]
- **Breadcrumb Mandiri (`.nwd-breadcrumb`) [PENDING T-226]:** `<nav aria-label="Breadcrumb">` dengan `<ol class="nwd-breadcrumb">` (reset `list-style: none`, flex wrap). Pemisah chevron CSS `::after ('›')` tanpa `<li>` pemisah di DOM. Item terakhir `aria-current="page"`, elipsis 1 baris. Jalur: `Home > News > [Judul]`.
- **Hierarki Editorial G2 [PENDING T-228]:** Urutan atas ke bawah:
  1. Breadcrumb `.nwd-breadcrumb` sejajar kolom artikel.
  2. Cover image rounded `.nwd-hero-media` selebar kolom artikel rasio tetap tanpa kotak pembungkus gelap.
  3. Tanggal publikasi abu-abu `.nwd-meta-date`.
  4. H1 Judul artikel `.nwd-title`.
  5. Atribusi editorial teks bersih `.nwd-author`: "Oleh Redaksi PT Euodoo" / "By PT Euodoo Editorial Team".
  6. Isi artikel HTML TinyMCE polos `.nwd-prose` langsung di atas background tanpa kartu pembungkus (tanpa border/shadow).
  7. Garis pemisah horizontal halus `1px solid var(--color-border)`.
  8. Seksi bagikan `.nwd-share` dengan 4 tombol sirkular (WhatsApp, Facebook, X, Salin Tautan) berbasis token hijau Euodoo (`var(--color-surface-container)` hover `var(--color-primary)`).
  9. Seksi rekomendasi artikel terkait `.nwd-related-sec` kontainer lebih lebar berlatar `var(--bg-subtle)`, 3 kartu terbaru selain artikel aktif (sembunyi bila kosong).
  10. Seluruh elemen G1 yang tidak ada di G2 dihapus dari tampilan publik.

---

## 7. Komponen Kartu Bersama & Token Desain Scoped [PENDING T-229]
- **Shared Card Component (`.nwl-card` / `.nwd-card`):** Satu komponen terpadu untuk grid `/news` dan related `/news/:slug`. Gambar 16:9 rounded (`var(--r-xl)`), tanggal kecil abu-abu (`var(--color-text-muted)`), judul tebal line-clamp 3 baris, link hijau "Baca Selengkapnya" (`var(--color-primary)`), min target 44px. Grid: 3 col desktop (>=1024px), 2 col tablet (640-1023px), 1 col mobile (<640px).
- **Isolasi Class:** Prefix scoped `.nwl-*` (listing) dan `.nwd-*` (detail). Homepage (`views/public/index.ejs`) dibekukan. Class lama `.news-card-v2` dialiaskan ke `.nwl-card` demi kompatibilitas `tests/test-modul12-public.js`.

---

## 8. Headline Slider Desktop & Mobile Reference [PENDING T-230]
- **Controller Data:** `postController.index` mengambil hingga 5 artikel headline aktif (`is_headline = 1` dan `status = 'published'`).
- **Desktop (1440x900):** Layout asimetris 2 kolom, tinggi maksimal ~420-450px. Kiri gambar 16:9 rounded, kanan tanggal, judul tebal, ringkasan (2-3 baris), link aksi. Indikator garis di kiri bawah, panah melingkar di kanan bawah.
- **Mobile (<768px):** Mengikuti referensi gambar mobile: Judul "News", gambar 16:9 rounded, tanggal, judul headline, ringkasan, link aksi, indikator garis di tengah, tombol panah sirkular di tengah bawah.
- **Interaksi:** Headline = 1: statis tanpa kontrol. Headline > 1: autoplay per 6 detik, pause saat hover/fokus, mati bila `prefers-reduced-motion` aktif. Navigasi manual panah, garis, keyboard, dan swipe sentuh.

---

## 9. Endpoint & Sistem Filter Berbasis Fetch API [PENDING T-231]
- **Endpoint Asynchronous:** `postController.index` merespons JSON bila ada header `Accept: application/json` atau query `ajax=1` berisi `{ success: true, posts: [...], currentPage, totalPages, totalPosts }`.
- **Klien Script (`public/js/news-filter.js`):** Menangani tab tipe G4 (garis bawah hijau), filter kategori, dan pencarian via `fetch()`. Memperbarui grid kartu dan pagination tanpa reload halaman.
- **URL & Fallback:** Sinkronisasi URL via `history.pushState(null, '', url)`. Tautan reguler tetap ada sebagai fallback SSR untuk SEO. Empty state rapi berbasis token saat data nihil.

---

## 10. Penanganan Fallback Gambar Netral [PENDING T-227]
- Mencegah error HTTP 404 ketika berkas fisik hilang atau `cover_image` bernilai `null` di database.
- Menggunakan placeholder SVG/WebP netral yang terverifikasi di `public/images/` atau kontainer netral `var(--color-surface-container)`.
- Rasio kartu terkunci 16:9 (CLS = 0). Tanpa inline event handler `onerror` (CSP safe).
