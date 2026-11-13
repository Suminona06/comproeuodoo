Status: ACTIVE | Terakhir diverifikasi: 2026-11-13 | Kode: controllers/public/postController.js, controllers/admin/postController.js, models/slugRedirectModel.js

# Tech Spec: Modul Berita & Publikasi (News & Articles)

## 1. Arsitektur & Komponen
Modul Berita mengelola publikasi korporat melalui editor TinyMCE, kategorisasi, kompresi sampul otomatis, HTTP 301 Redirect slug, serta penyajian portal `/news` (SSR + Fetch API). Rincian teknis halaman detail (`/news/:slug`) berada pada [tech/news-detail.md](news-detail.md).

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/news` | `postController.index` | `seoMiddleware`, `i18nMiddleware` | Portal berita & headline; JSON jika fetch/ajax |
| `GET` | `/news/:slug` | `postController.detail` | `seoMiddleware`, `i18nMiddleware` | Detail artikel G2 / cek 301 (lihat `tech/news-detail.md`) |
| `GET` | `/admin/posts` | `admin/postController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin','editor'])` | Daftar artikel admin |
| `POST` | `/admin/posts` | `admin/postController.store` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Simpan artikel baru |
| `POST` | `/admin/posts/:id` | `admin/postController.update` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Update artikel & catat slug 301 |
| `POST` | `/admin/posts/upload-image` | `admin/postController.uploadEditorImage` | `requireAuth`, `roleMiddleware`, `uploadMedia` | Upload gambar TinyMCE |
| `GET/POST`| `/admin/post-categories` | `postCategoryController.*`| `requireAuth`, `roleMiddleware` | Kelola kategori berita |

---

## 3. Skema Data Terkait

### A. Tabel `posts`
*File Migrasi:* `database/migrations/001_create_initial_schema.sql`, `003_upgrade_v2_schema.sql`
- Kolom: `id` (INT PK), `category_id` (INT FK), `title_id` / `title_en` (VARCHAR 255), `slug` (VARCHAR 191 UNIQUE), `excerpt_id` / `excerpt_en` (TEXT), `content_id` / `content_en` (LONGTEXT), `cover_image` (VARCHAR 500), `is_headline` (TINYINT(1) DEFAULT 0), `status` (ENUM 'draft','published','archived'), `published_at` (DATETIME), `meta_*`, `og_image`, `canonical_url`, `robots`.

### B. Tabel `post_categories` & `slug_redirects`
- `post_categories`: `id`, `name_id`, `name_en`, `slug`, `type` (`news`, `press`, `blog`), `sort_order`.
- `slug_redirects`: `id`, `entity_type`, `entity_id`, `old_slug`, `new_slug`, `created_at`.

---

## 4. Alur Logika Custom Slug & Auto Redirect 301
1. Pada `admin/postController.update`: jika `slug` baru berbeda dari yang lama pada artikel `published`, simpan entri baru ke `slug_redirects` dan perbarui rantai redirect lama agar menunjuk langsung ke `new_slug`.
2. Pada `postController.detail`: jika artikel tidak ditemukan, cek `slugRedirectModel.findByOldSlug('post', slug)`. Jika ada, kirim HTTP `301 Moved Permanently` ke `/news/${redirect.new_slug}`.

---

## 5. Keamanan, Sanitasi & Validasi
- Konten HTML disanitasi menggunakan `sanitize-html` di server sebelum disimpan.
- Query parameter (`type`, `category`, `search`, `page`) divalidasi whitelist di server.

---

## 6. Detail Artikel (`/news/:slug`)
- Seluruh struktur `.nwd-*`, breadcrumb mandiri, `.nwd-prose`, `public/js/news-detail.js`, serta integrasi SweetAlert2 Toast 2 detik (`useSweetAlert: true` `[PENDING T-326]`) didokumentasikan pada sub-modul [tech/news-detail.md](news-detail.md).

---

## 7. Struktur Section, Latar Selang-Seling, & Komponen Kartu Bersama
- **Pemecahan 2 Section (`views/public/news.ejs`):** Di bawah `.page-hero`, `/news` memakai 2 `<section>` terpisah yang diekstrak ke `views/partials/news/headline-section.ejs` dan `views/partials/news/filter-bar.ejs` (`<= 100` baris, zero `style="..."`, zero `<script>` inline):
  1. `.nwl-sec-headline#nwlHeadlineSec`: `background-color: var(--bg-soft-green)`.
  2. `.nwl-sec-directory`: `background-color: var(--bg-subtle)` dengan `::before` gradasi pendek (`48px` mobile, `80px` desktop) memakai `var(--trans-soft-green-to-subtle)` (atau fallback `var(--bg-soft-green)` bila headline kosong).
- **Lokalisasi Empty State:** `t('news.empty_desc')` dan `t('news.empty_reset')` simetris di ID & EN.
- **Shared Card Component (`.nwl-card` / `.nwd-card`):** Permukaan `var(--color-surface)`, border `1px solid var(--color-border)`, elevasi `var(--shadow-level-1)`, gambar 16:9 `var(--r-xl)`, tanggal `var(--color-text-muted)`, line-clamp 3 baris, link `var(--color-primary)` (`>= 44px`). Grid: 3 col (`>=1024px`), 2 col (`640-1023px`), 1 col (`<640px`).
- **Isolasi Class:** Prefix `.nwl-*` (listing) dan `.nwd-*` (detail). `views/public/index.ejs` dibekukan. Alias `.news-card-v2` ke `.nwl-card` dipertahankan untuk `tests/test-modul12-public.js`.

---

## 8. Headline Slider & Judul Dinamis per Slide Aktif
- **Controller Data:** `postController.index` mengambil hingga 5 artikel (`is_headline = 1`, `status = 'published'`) lintas tipe, tidak terpengaruh filter direktori.
- **Judul Dinamis `.nwl-headline-sec-title`:** Setiap `.nwl-slide` menyematkan `data-post-type="<%= hPost.type %>"` dan `#nwlHeadlineSlider` menyimpan atribut kamus `news.headline_title_*` & `news.headline_aria_*`. SSR memakai `headlinePosts[0].type`; saat pindah slide, JS menyinkronkan `.nwl-headline-sec-title` dan `aria-label` `#nwlHeadlineSec`.
- **Desktop (`1440x900`) & Mobile (`<768px`):** Desktop asimetris 2 col (~420-450px max-height); mobile terpusat. Headline = 1 statis; > 1 autoplay 6 detik, pause saat hover/fokus, mati saat `prefers-reduced-motion` aktif.

---

## 9. Sistem Filter Fetch API, Kategori Geser Mobile, & Paginasi Bersama `.pgn-*`
- **Endpoint Fetch (`postController.index`):** `limit = 9`, JSON `{ success: true, posts, currentPage, totalPages, totalPosts }` bila `Accept: application/json` atau `ajax=1`.
- **Filter Kategori Geser Mobile (`.nwl-cat-pills`):** Pada `@media (max-width: 767px)`, `flex-wrap: nowrap; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none;`, pill `>= 44px`, `:focus-visible`, dan `scrollActivePillIntoView()`. `.nwl-search-form` selebar 100% di bawah baris pill.
- **Paginasi Bersama (`views/partials/pagination.ejs` / `.pgn-bar--public`):** Menyatu dengan `.nwl-sec-directory` (tanpa kartu pembungkus luar), tampil saat `totalPosts > 0` (`disabled` bila `totalPages === 1`), desktop tampilkan nomor & elipsis, mobile tampilkan 4 tombol ikon `>= 44x44px` mengapit `currentPage / totalPages`. Menggunakan `t('pagination.*')`, `aria-current="page"`, `renderPagination()` di `public/js/news-filter.js`, serta `history.pushState` / `popstate`.

---

## 10. Penanganan Fallback Gambar Netral
- Mencegah 404 saat berkas hilang atau `cover_image` bernilai `null`; memakai placeholder netral terverifikasi di `public/images/` atau kontainer `var(--color-surface-container)`, rasio 16:9 terkunci (CLS = 0), tanpa inline `onerror` (CSP-safe).
