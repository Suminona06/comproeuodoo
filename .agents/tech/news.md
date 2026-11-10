Status: ACTIVE | Terakhir diverifikasi: 2026-10-28 | Kode: controllers/public/postController.js, controllers/admin/postController.js, models/slugRedirectModel.js

# Tech Spec: Modul Berita & Publikasi (News & Articles)

## 1. Arsitektur & Komponen
Modul Berita mengelola artikel publikasi korporat melalui integrasi editor TinyMCE, sistem kategorisasi, pemrosesan gambar sampul otomatis, penanganan pengalihan tautan otomatis (HTTP 301 Redirect), dan penyajian data publik berbasis SSR serta asynchronous Fetch API.

---

## 2. Rute & Controller

| Method | Path | Controller / Handler | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/news` | `postController.index` | `seoMiddleware`, `i18nMiddleware` | Portal berita & headline; JSON jika fetch/ajax |
| `GET` | `/news/:slug` | `postController.detail` | `seoMiddleware`, `i18nMiddleware` | Detail artikel G2 / cek redirect 301 |
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
2. Pada `controllers/public/postController.detail`: jika artikel tidak ditemukan, cek `slugRedirectModel.findByOldSlug('post', slug)`. Jika ada, kirim respon HTTP `301 Moved Permanently` ke `/news/${redirect.new_slug}`.

---

## 5. Keamanan, Sanitasi & Validasi
- Konten HTML disanitasi menggunakan `sanitize-html` di server sebelum disimpan ke database.
- Query parameter (`type`, `category`, `search`, `page`) divalidasi whitelist di server.

---

## 6. Tata Letak Detail Artikel & Breadcrumb Mandiri
- **Breadcrumb Mandiri (`.nwd-breadcrumb`):** `<nav aria-label="Breadcrumb">` dengan `<ol class="nwd-breadcrumb">` (reset `list-style: none`, flex wrap). Pemisah chevron CSS `::after ('›')` tanpa `<li>` pemisah di DOM. Item terakhir `aria-current="page"`, elipsis 1 baris. Jalur: `Home > News > [Judul]`.
- **Hierarki Editorial G2:** Urutan atas ke bawah:
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

## 7. Struktur Section, Latar Selang-Seling, & Komponen Kartu Bersama
- **Pemecahan 2 Section & Latar Selang-Seling (`views/public/news.ejs`) `[PENDING T-307, T-309]`:**
  - Di bawah `.page-hero` (tetap berlatar gambar/gelap), halaman `/news` dipecah menjadi 2 `<section>` semantik dan diekstraksi ke partial modular (`views/partials/news/headline-section.ejs` dan `views/partials/news/filter-bar.ejs`, masing-masing `<= 100` baris tanpa `style="..."` maupun `<script>` inline):
    1. `.nwl-sec-headline#nwlHeadlineSec`: memakai `background-color: var(--bg-soft-green)`.
    2. `.nwl-sec-directory`: memakai `background-color: var(--bg-subtle)` dengan pseudo-element `::before` gradasi tepi pendek (`height: 48px` pada `< 768px`, `height: 80px` pada `>= 768px`) memakai `var(--trans-soft-green-to-subtle)` (atau fallback `var(--bg-soft-green)` bila tidak ada artikel headline di database).
- **Shared Card Component (`.nwl-card` / `.nwd-card`):** Satu komponen terpadu untuk grid `/news` dan related `/news/:slug`. Permukaan `var(--color-surface)` dengan border `1px solid var(--color-border)` dan elevasi `var(--shadow-level-1)` agar kontras di atas kedua latar, gambar 16:9 rounded (`var(--r-xl)`), tanggal kecil (`var(--color-text-muted)`), judul tebal line-clamp 3 baris, link hijau "Baca Selengkapnya" (`var(--color-primary)`), min target 44px. Grid: 3 col desktop (>=1024px), 2 col tablet (640-1023px), 1 col mobile (<640px).
- **Isolasi Class:** Prefix scoped `.nwl-*` (listing) dan `.nwd-*` (detail). Homepage (`views/public/index.ejs`) dibekukan. Class lama `.news-card-v2` dialiaskan ke `.nwl-card` demi kompatibilitas `tests/test-modul12-public.js`.

---

## 8. Headline Slider & Judul Dinamis per Slide Aktif `[PENDING T-309, T-310]`
- **Controller Data:** `postController.index` mengambil hingga 5 artikel headline aktif (`is_headline = 1` dan `status = 'published'`) lintas tipe publikasi, tidak dipengaruhi filter direktori (`type`, `category`, `search`).
- **Judul Dinamis `.nwl-headline-sec-title` Mengikuti Slide Aktif `[PENDING T-310]`:**
  - Setiap `.nwl-slide` menyematkan `data-post-type="<%= hPost.type %>"` (`berita`, `pers`, atau `blog`), dan `#nwlHeadlineSlider` menyimpan atribut kamus dwibahasa untuk ke-3 jenis tersebut (`news.headline_title_berita`, `news.headline_title_pers`, `news.headline_title_blog`, beserta `news.headline_aria_*` di `locales/id.json` & `locales/en.json`).
  - Saat render SSR awal, `.nwl-headline-sec-title` dan `aria-label` `#nwlHeadlineSec` merender label sesuai `headlinePosts[0].type` (`"Berita"` / `"Siaran Pers"` / `"Blog"` untuk ID; `"News"` / `"Press Releases"` / `"Blog"` untuk EN).
  - Saat fungsi slider berpindah slide (klik panah, klik dot garis, swipe, atau autoplay), skrip eksternal membaca `data-post-type` slide aktif dan memperbarui teks `.nwl-headline-sec-title` serta `aria-label` section secara sinkron.
- **Desktop (1440x900) & Mobile (<768px):** Desktop asimetris 2 kolom (tinggi maksimal ~420-450px, gambar 16:9 rounded di kiri, konten di kanan, indikator garis di kiri bawah, panah di kanan bawah); mobile bertumpuk terpusat. Headline = 1: statis tanpa kontrol; Headline > 1: autoplay per 6 detik, pause saat hover/fokus, mati bila `prefers-reduced-motion` aktif.

---

## 9. Sistem Filter Fetch API, Kategori Geser Mobile, & Paginasi Bersama `.pgn-*` `[PENDING T-311, T-312]`
- **Endpoint Asynchronous (`postController.index`):** Batas `limit = 9` artikel per halaman; merespons JSON bila ada header `Accept: application/json` atau query `ajax=1` berisi `{ success: true, posts: [...], currentPage, totalPages, totalPosts }`.
- **Filter Kategori Geser Mobile (`.nwl-cat-pills`) `[PENDING T-311]`:** Pada `@media (max-width: 767px)`, `.nwl-cat-pills` menggunakan `flex-wrap: nowrap; overflow-x: auto; scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; scrollbar-width: none;` dengan petunjuk visual geser, tinggi pill `>= 44px`, outline `:focus-visible` utuh, dan helper `scrollActivePillIntoView()` (`scrollIntoView({ inline: 'center', block: 'nearest' })`). `.nwl-search-form` diletakkan di bawah baris pill dengan lebar 100%.
- **Komponen Paginasi Bersama (`views/partials/pagination.ejs` / `.pgn-bar--public`) `[PENDING T-312]`:**
  - Menggunakan partial bersama `views/partials/pagination.ejs` (`variant: 'public'`) dan class `.pgn-*` di `public/css/components.css`; class duplikat `.pagination-bar` / `.pagination-item` dihapus.
  - Tetap dirender saat `totalPages === 1` (selama `totalPosts > 0`) dengan tombol navigasi berstatus `disabled`.
  - Desktop (`>= 768px`): menampilkan tombol `«`, `‹`, deret nomor halaman `.pgn-num` dengan `.pgn-ellipsis` (`...`), serta tombol `›`, `»`.
  - Mobile (`< 768px`): menyembunyikan `.pgn-pages` dan menampilkan 4 tombol ikon persegi membulat (`[ « ]` `[ ‹ ]` `1 / 2` `[ › ]` `[ » ]`, minimal `44x44px`) mengapit `.pgn-mobile-info` (`currentPage / totalPages`).
  - Seluruh tautan SSR memakai `<a href="/news?...">`, `aria-label` menggunakan `t('pagination.*')` (ID/EN), halaman aktif memiliki `aria-current="page"`, serta `renderPagination()` di `public/js/news-filter.js` menghasilkan markup `.pgn-*` yang identik dan menyinkronkan `history.pushState` / `popstate`.

---

## 10. Penanganan Fallback Gambar Netral
- Mencegah error HTTP 404 ketika berkas fisik hilang atau `cover_image` bernilai `null` di database.
- Menggunakan placeholder SVG/WebP netral yang terverifikasi di `public/images/` atau kontainer netral `var(--color-surface-container)`.
- Rasio kartu terkunci 16:9 (CLS = 0). Tanpa inline event handler `onerror` (CSP safe).
