# AUDIT SPESIFIKASI DAN KONDISI KODE REPO PT EUODOO
**Tanggal:** 2026-10-21  
**Cabang Git:** `chore/prune-specs`  
**Tujuan:** Audit komprehensif inventaris fitur, pembuktian kondisi kode nyata vs dokumen spek, inventaris konten non-spek untuk diarsipkan, pemetaan struktur modular target, dan resolusi konflik dokumen.

---

## BASELINE DOKUMEN PRA-REFAKTOR (FASE 0)
Arsip utuh telah disalin ke `.agents/archive/2026-10-21_pre-prune/`:
- `.agents/1-PRD.md`: 93.555 bytes (~23.389 token)
- `.agents/2-TECH-SPEC.md`: 178.240 bytes (~44.560 token)
- `.agents/3-TASKS.md`: 18.842 bytes (~4.711 token)
- `AGENTS.md`: 1.685 bytes (~421 token)
- **Total:** 292.322 bytes (~73.081 token)

---

## A. INVENTARIS FITUR KONSOLIDASI
*Status: ACTIVE | PENDING | SUPERSEDED | DEPRECATED | UNSURE*

| Fitur | Lokasi di PRD | Lokasi di Tech Spec | Status | Bukti Kode Repo | Aksi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Banner Slider (Dual CTA + Multi-Format Media)** | 5.4 (FR-10, FR-11), 8.1, 10.1, 16.1 | 1.3, 2.1, 3.2, 4.1, 6.2, 11.1, 16.1, 16.2 | **ACTIVE** | `database/migrations/014_add_secondary_cta_to_banners.sql`; Kolom `cta_secondary_*` di tabel `banners`; `views/public/index.ejs:16-33`; `controllers/admin/bannerController.js:86-176`; `views/admin/banners/create.ejs` & `edit.ejs`. Format: image, video, youtube. | Simpan kondisi akhir Dual CTA di `prd/public-home.md` & `tech/public-home.md`. Single CTA dinyatakan SUPERSEDED. |
| **Company Introduction (Homepage)** | 3.2, 4.1, 11.1 | 3.2, V6 B.2 | **ACTIVE** | `views/public/index.ejs:75-103` (`.sec-intro`); `models/homeContentModel.js:20-65`; Key `settings`: `home_intro_*`. | Simpan di modul `public-home`. |
| **Category Showcase (4 Panel Kategori Primer Homepage)** | 3.2, 5.3 (FR-07), 15.1, 15.3 | 2.1, 3.2, 15.1, 15.2, 15.3, 15.4 | **ACTIVE** | `database/migrations/013_add_is_active_to_product_categories.sql`; Kolom `is_active` & `image_url` di `product_categories`; `views/public/index.ejs:105-166` (`.sec-products`, `.hcat-grid`, `.hcat-panel`); `controllers/public/homeController.js:40-48`. | Simpan di modul `public-home` & `products`. Format lama grid produk individual SUPERSEDED. |
| **Flag Unggulan Produk (`is_featured`)** | 5.3 (FR-07), 15.3 | 2.1, 15.5 | **DEPRECATED** | `database/migrations/011_drop_product_is_featured.sql` (`ALTER TABLE products DROP COLUMN is_featured;`). Kolom sudah terhapus permanen dari skema tabel `products`. | Arsipkan seluruh rujukan `is_featured` ke `archive/`. |
| **3 Pilar Keunggulan Homepage (`#sec-pillars`)** | 3.2, 10.1, 11.3, 15.2 | 3.2, V5 bagian 5, V6 B.3, 15.2 | **SUPERSEDED** | `database/migrations/012_cleanup_legacy_home_pillars_settings.sql` (hapus key `home_pillars_*`); `views/public/index.ejs:189-190` digantikan oleh Why Choose Us (`.sec-why-us`, `.wcu-*`). Anchor `#pilar` hanya dipertahankan sebagai alias navigasi. | Arsipkan narasi & skema 3 pilar lama ke `archive/`. |
| **Why Choose Us (Homepage Editorial & Artbox)** | 15.2 | 15.2, 15.3, 15.4 | **ACTIVE** | `views/public/index.ejs:168-273` (`.sec-why-us`, `.wcu-card`, `.wcu-layout`, `.wcu-artbox`); `public/css/components.css`; Key `settings`: `home_wcu_*`; `controllers/admin/homeContentController.js:100-140`. | Simpan di modul `public-home`. |
| **Certifications & Accreditations (Homepage Evidence)** | 11.3 | V6 B.4, V6 C.1 | **ACTIVE** | `views/public/index.ejs:275-316` (`.sec-evidence`, `.cert-grid`); `controllers/admin/homeContentController.js`; Key `settings`: `home_cert_*`. (Catatan: Toggle `home_cert_is_active` di DB bernilai `0`, section tampil jika diaktifkan via CMS). | Simpan di modul `public-home` & `admin-cms` sebagai section opsional via toggle CMS. |
| **Registered Brands (Merek Paten & Terdaftar)** | 5.7 (FR-17, FR-18 format kartu), 10.1, 16.2 | 1.3, 2.1, 3.2, 4.5, V4 B.1, 16.3, 16.4 | **ACTIVE** | `views/public/index.ejs:334-434` (`.brand-strip-sec`, `.brand-strip-marquee`, `.brand-strip-track`); Modal zoom lightbox `#brandPreviewModal`; `public/js/main.js:75-140`; `controllers/admin/brandController.js:120-136` (update judul dinamis via `/admin/brands/section-title`); `tests/test-t189-dead-code-cleanup.js`. | Simpan kondisi akhir Marquee Minimalis + Modal Zoom di modul `public-home` & `admin-cms`. Format kartu grid v1 & ribbon v4 SUPERSEDED. |
| **Katalog Produk & Detail Produk Publik** | 3.2, 4.2, 5.3 (FR-07, FR-08, FR-09), 15.1 | 1.3, 2.1, 3.2, 4.2, 4.3, 15.1 | **ACTIVE** | `routes/publicRoutes.js` (`/products`, `/products/:slug`); `views/public/products.ejs`; `views/public/product-detail.ejs`; `models/productModel.js`; `models/productCategoryModel.js`; Deep link filter `?category=<slug>`; Export CSV `/admin/products/export`. | Simpan di modul `products`. |
| **Varian Produk (`product_variants`)** | 5.3 (FR-08) | 2.1, 4.3 | **ACTIVE** | Tabel `product_variants`; `models/productModel.js:260-310` (query `product_variants` langsung di dalam model produk); Tampil di tab spesifikasi detail produk. | Simpan kontrak tabel `product_variants` di modul `products`. (Bukan file model terpisah). |
| **Artikel Berita & Publikasi (News, Press, Blog)** | 3.2, 4.3, 5.5 (FR-12, FR-13), 8.4, 9.1, 10.2, 10.3 | 1.3, 2.1, 3.2, 4.4, 7.2, 11.2 | **ACTIVE** | `routes/publicRoutes.js` (`/news`, `/news/:slug`); `views/public/news.ejs`; `views/public/news-detail.ejs`; `models/postModel.js`; `models/postCategoryModel.js`; `models/slugRedirectModel.js` (Redirect 301 otomatis saat slug diubah); Editor TinyMCE di `views/admin/posts/edit.ejs`; Headline slider berita. | Simpan di modul `news`. |
| **Tentang Kami (Profil, Nilai Inti, Visi Misi, Sejarah, Bento Gallery, Statistik)** | 3.2, 4.1, 12.1-12.7, Revisi v2 (Bento), Revisi v3 (Penyempurnaan Bento) | 1.3, 2.1, 8.1-8.6, 12.1, 12.2, 13.1 | **ACTIVE** | `routes/publicRoutes.js` (`/about`); `views/public/about.ejs`; Galeri Bento Mosaik `.abt-gal-*` di `public/css/components.css` & `public/js/main.js:469-580`; `models/aboutModel.js`; `models/aboutGalleryModel.js`; `models/aboutStatsModel.js`; `models/aboutTimelineModel.js`; Migrasi `007_*` & `008_make_about_gallery_title_nullable.sql`. | Simpan kondisi akhir di modul `public-about`. Gallery slider v1 & lokasi operasional SUPERSEDED / DEPRECATED. |
| **Kapabilitas Mesin Manufaktur (`/capabilities`)** | 5.8 (disebutkan sepintas di FR-19 item 8) | 1.3, 2.1, 6.1, 6.2 | **ACTIVE** | `routes/publicRoutes.js:44` (`/capabilities`); `routes/adminRoutes.js:160` (`/admin/capabilities`); `views/public/capabilities.ejs`; `views/admin/capabilities/`; `models/capabilityModel.js`; `controllers/admin/capabilityController.js`. | Dokumentasikan secara utuh di modul `products` (atau modul terpisah jika diminta). |
| **Kontak & Form RFQ (`/contact`)** | 3.2, 4.4, 5.6 (FR-14), 8.1, 14.1, 14.2, 14.3 | 1.3, 2.1, 3.2, 4.6, 6.3, 13.1-13.3, 14.1-14.3 | **ACTIVE** | `routes/publicRoutes.js:51-52` (`/contact`); `views/public/contact.ejs` (Class prefix `.cf-*`, dual office cards Head Office & Factory, embed Google Maps responsif); `controllers/public/contactController.js`; Rate limiter `leadLimiter`; Migrasi `010_revisi_kontak_footer_v1.sql`. Kartu WhatsApp di `/contact` SUDAH DIHAPUS. | Simpan di modul `contact-footer`. Arsipkan spec kartu WA di `/contact`. |
| **Floating Button WhatsApp & WhatsApp Global** | 5.6 (FR-15) | 1.3, 3.1, 4.6 | **ACTIVE** | `views/partials/whatsapp-btn.ejs`; `views/partials/footer.ejs:170`; `public/js/whatsapp.js`; Key `settings`: `whatsapp_number`, `whatsapp_default_message`, `whatsapp_formatted_number`. | Simpan di modul `contact-footer` & `settings`. |
| **Master Site Footer & Global Pre-Footer CTA** | 3.1, 11.4, 13.1, 13.2, 14.2 | 1.3, 3.1, V6 B.5, 12.1-12.3, 13.2, 14.2 | **ACTIVE** | `views/partials/footer.ejs`; `views/partials/cta-global.ejs`; `models/homeContentModel.js` (`global_cta_*`); Dual office contacts (Palmerah & Cigondewah); Toggle & URL sosmed dinamis (`social_*`); Permukaan footer hijau gelap `#00573F`. | Simpan di modul `contact-footer`. |
| **Media Library & Universal Media Picker** | 5.8 (FR-19), 8.2, 8.3, 8.6 | 1.3, 2.1, 5.2, 6.4, 6.5, 6.7 | **ACTIVE** | `routes/adminRoutes.js:58-66` (`/admin/media`, `/admin/api/media`); `views/admin/media/`; `views/partials/media-picker-modal.ejs`; `controllers/admin/mediaController.js`; `models/mediaModel.js`; `middleware/uploadMiddleware.js` (Sharp WebP pipeline, auto-generate thumbnail, storage driver local/S3 support, limit 30MB). | Simpan di modul `media-library`. |
| **Autentikasi Admin, Keamanan & RBAC** | 5.1 (FR-01 s/d FR-04), 5.10 (FR-23) | 1.3, 2.1, 4.7, 5.1 | **ACTIVE** | Tabel `users` (role: superadmin, admin, editor); `controllers/admin/authController.js`; `controllers/admin/userController.js`; `middleware/authMiddleware.js` (JWT cookie HttpOnly); `middleware/roleMiddleware.js`; `middleware/rateLimiter.js` (brute-force protection, account lock 15 menit); `middleware/csrfMiddleware.js`. | Simpan di modul `admin-cms` & `seo-security`. |
| **Pengelolaan Inquiry / Leads (Admin CMS)** | 5.6 (FR-16), 8.1 | 1.3, 2.1, 4.6, 6.3 | **ACTIVE** | Tabel `inquiries`; `routes/adminRoutes.js:103` (`/admin/inquiries` & alias `/admin/leads`); `controllers/admin/inquiryController.js`; `models/inquiryModel.js`; `views/admin/inquiries/`; Status: baru, dibaca, ditindaklanjuti, ditolak; Export CSV. (Catatan: `leadModel.js` adalah kode lama yang tidak dipakai). | Simpan di modul `admin-cms`. Kontrak tabel resmi adalah `inquiries`. |
| **SEO Terkelola, Sitemap, Robots & Turnstile** | 5.9 (FR-20, FR-21), 6.2, 6.3, 8.4, 8.5 | 1.3, 2.1, 4.8, 5.1, 5.2, 6.6 | **ACTIVE** | `controllers/public/seoController.js` (Dynamic `/sitemap.xml` & `/robots.txt`); `middleware/seoMiddleware.js` (Injeksi Open Graph, Canonical, Hreflang, JSON-LD schema); Cloudflare Turnstile di `utils/turnstileVerifier.js`. | Simpan di modul `seo-security`. |
| **Pengaturan Situs Global (Settings CMS)** | 5.10 (FR-22), 8.2, 8.3, 13.1, 13.2, 14.2 | 1.3, 2.1, 4.9, 6.4, 6.5, 12.1-12.2, 13.2, 14.2 | **ACTIVE** | Tabel `settings` (key-value); `controllers/admin/settingController.js`; `models/settingModel.js`; `views/admin/settings/`; Upload Favicon, Logo Header, Logo Footer; Dual-lokasi alamat/fax/email; Sosmed visibility toggles. | Simpan di modul `settings`. |
| **Sistem Desain Visual (Rebrand Palet Hijau v1 & Design Tokens)** | 6.3, 15, 16 | 3.1, 3.2, Revisi V5, 15, 16 | **ACTIVE** | `Design/DESIGN.md`; `public/css/tokens.css` (`--color-primary: #00755a`, `--color-leaf: #7cbe38`, `--surface-dark-footer: #00573f`, dual-token bg `#ffffff` & `#f8fafc`); `tests/test-rebrand-zero-blue.js`. Nilai hex biru lama di spec sudah usang. | Hapus nilai hex dari spec modul, alihkan rujukan resmi ke `Design/DESIGN.md`. |
| **Tabel Legacy `categories` (Database v1)** | 5.3 (skema awal) | 2.1 (skema awal) | **DEPRECATED** | Tabel `categories` masih ada di MySQL tetapi tidak ada baris kode aktif di repo yang membacanya. Digantikan oleh `product_categories` sejak migrasi `003_upgrade_v2_schema.sql`. | Arsipkan skema `categories`. Kontrak aktif adalah `product_categories`. |
| **Tabel Legacy `pages` (Database v1/v2)** | 3.2 (halaman statis) | 2.1 (tabel `pages`) | **DEPRECATED** | Tabel `pages` ada di MySQL (1 row slug `about`), namun tidak pernah di-query oleh `pageController.js` maupun `aboutController.js` (konten About dikelola via `settings` & `about_*` tables). | Arsipkan skema `pages`. Kontrak aktif About adalah `aboutModel` + `about_*`. |
| **Model Legacy `leadModel.js` & `leadController.js`** | - | - | **DEPRECATED** | Menjalankan query ke tabel `leads` yang tidak ada di MySQL (`Table 'euodoo_db.leads' doesn't exist`). Rute `/admin/leads` sudah dialihkan ke `inquiryController.js`. | Catat sebagai dead code yang tidak lagi menjadi acuan spek. Kontrak resmi adalah `inquiries`. |

---

## B. CEK KHUSUS: BUKTI DAN BANTAHAN

### 1. 3 Pilar Keunggulan Homepage vs Why Choose Us
- **Status:** **SUPERSEDED** (Terbukti digantikan oleh Why Choose Us).
- **Bukti Kode:**
  - Migrasi `database/migrations/012_cleanup_legacy_home_pillars_settings.sql` mengeksekusi penghapusan key: `'home_pillars_title_id'`, `'home_pillars_title_en'`, `'home_pillars_subtitle_id'`, `'home_pillars_subtitle_en'`, `'home_pillars_is_active'`, `'home_pillars_json'`.
  - Pada `views/public/index.ejs:189-273`, section beranda menggunakan class `.sec-why-us.sec-pillars` dan seluruh komponen di dalamnya menggunakan prefix `.wcu-*` (`.wcu-card`, `.wcu-header`, `.wcu-layout`, `.wcu-copy`, `.wcu-kicker`, `.wcu-headline`, `.wcu-desc`, `.wcu-artbox`, `.wcu-float-card`).
  - Anchor `<span id="pilar" class="sec-pillars" aria-hidden="true"></span>` hanya dipertahankan sebagai alias tautan navigasi backward-compatible.
  - Class `.pillar-card` di beranda telah dihapus total. (Kemunculan `.pillar-card` di codebase hanya ada pada halaman Tentang Kami `views/public/about.ejs:171` untuk kartu Nilai-Nilai Inti perusahaan).

### 2. Brands V4 (Kartu/Ribbon) vs Marquee v1
- **Status:** **ACTIVE** Marquee Strip Minimalis (`.brand-strip-*`). Kartu/Ribbon lama terbukti **DEPRECATED & PRUNED**.
- **Bukti Kode:**
  - `views/public/index.ejs:335-434` merender `.sec-brands.brand-strip-sec`, `.brand-strip-wrapper`, `.brand-strip-marquee`, `.brand-strip-track`.
  - `public/css/components.css` mendefinisikan seluruh styling strip marquee responsif (mask-image gradien, desktop clamp 84-115px, hover zoom scale 1.18, mobile clamp 56-75px, fallback prefers-reduced-motion flex-wrap).
  - Skrip uji `tests/test-t189-dead-code-cleanup.js` memvalidasi bahwa seluruh selector kartu lama (`.brand-card`, `.brand-logo-wrap`, `.brand-meta-wrap`, `.brand-name-text`, `.brands-header`, `.brands-kicker`, `.brands-title`, `.brands-desc`, `.marquee-wrapper`, `.marquee-group`) telah **0 kemunculan** di `public/css/components.css`.
  - **Retensi Modal Zoom Preview:** Lightbox popup modal `#brandPreviewModal` (`.brand-preview-modal`, `.brand-modal-dialog`, `.brand-modal-backdrop`, `.brand-modal-close`, `.brand-modal-img-wrap`, `.brand-zoom-hint`, `.brand-fallback-initials`) dan handler interaktivitasnya di `public/js/main.js` **TETAP AKTIF** dan dipertahankan.

### 3. Hero Banner Single CTA vs Dual CTA
- **Status:** **ACTIVE** Dual CTA. Single CTA terbukti **SUPERSEDED**.
- **Bukti Kode:**
  - Migrasi `database/migrations/014_add_secondary_cta_to_banners.sql` ada dan telah dieksekusi:
    ```sql
    ALTER TABLE banners
      ADD COLUMN cta_secondary_text_id VARCHAR(100) NULL AFTER cta_url,
      ADD COLUMN cta_secondary_text_en VARCHAR(100) NULL AFTER cta_secondary_text_id,
      ADD COLUMN cta_secondary_url VARCHAR(500) NULL AFTER cta_secondary_text_en;
    ```
  - Kolom terverifikasi ada pada MySQL `banners`: `cta_secondary_text_id`, `cta_secondary_text_en`, `cta_secondary_url`.
  - Tampilan publik `views/public/index.ejs:16-33` merender `.hero-actions.hero-cta-wrap` dengan tombol utama `.hero-cta-btn--primary.btn-pill-solid-white` dan tombol kedua `.hero-cta-btn--secondary.btn-pill-white`.
  - Formulir Admin `views/admin/banners/create.ejs` & `edit.ejs` dan controller `controllers/admin/bannerController.js:86-293` mengelola dan memvalidasi input tombol kedua.

### 4. Gallery Slider v1 vs Bento Grid (About Us)
- **Status:** **ACTIVE** Bento Grid (`.abt-gal-*` / `.bento-*`). Gallery slider v1 terbukti **SUPERSEDED**.
- **Bukti Kode:**
  - `views/public/about.ejs` merender galeri berhalaman berbasis bento mosaic grid.
  - `public/css/components.css:4881-5379` mendefinisikan `.sec-gallery .abt-gal-grid`, `.abt-gal-tile`, `.abt-gal-tile--pos-1` s/d `pos-6`, layout adaptif 5/4/3/2/1 tile, transisi Shutter Wipe, kontrol paginasi, dan interaksi keyboard/focus.
  - `public/js/main.js:469-580` menggerakkan engine Bento Gallery dengan penataan tile dinamis, pagination controller, dan image pre-decode.
  - Slider horizontal lama v1 tidak lagi digunakan.

### 5. Hex Biru Lama di Spek vs Rebrand Hijau (T-158..T-168)
- **Status:** **ACTIVE** Rebrand Palet Hijau v1. Seluruh hex biru lama di spek terbukti **SUPERSEDED**.
- **Bukti Kode:**
  - `Design/DESIGN.md` mendefinisikan warna resmi: Primary `#00755A`, Primary Bright `#00906E`, Primary Hover `#009476`, Primary Dark `#00573F`, Leaf Accent `#7CBE38`, Dark Deep `#071F17`, Dark Surface `#0B281E`, Dark Footer `#00573F`, Dual-token BG `#FFFFFF` & `#F8FAFC`.
  - `public/css/tokens.css` mendefinisikan token CSS `--color-primary: #00755a`, `--color-primary-dark: #00573f`, `--color-leaf: #7cbe38`, dll.
  - Skrip pengujian `tests/test-rebrand-zero-blue.js` dan `tests/test-rebrand-visual-functional.js` memverifikasi zero blue rona pada seluruh public view dan CMS dashboard.
  - Hex biru lama di `1-PRD.md` dan `2-TECH-SPEC.md` (`#0f2b5c`, `#1e40af`, `#3b82f6`, `#e0e7ff`) bertentangan dengan repo nyata.

### 6. Kolom `is_featured` Produk
- **Status:** **DEPRECATED & DROPPED**.
- **Bukti Kode:**
  - Migrasi `database/migrations/011_drop_product_is_featured.sql` mengeksekusi `ALTER TABLE products DROP COLUMN is_featured;`.
  - Skema tabel `products` di database MySQL (`DESCRIBE products;`) membuktikan bahwa kolom `is_featured` sudah **TIDAK ADA**.
  - Katalog admin di `views/admin/products/index.ejs`, `edit.ejs`, dan controller `controllers/admin/productController.js` sudah bersih dari toggle featured.

### 7. Kartu WhatsApp di `/contact` vs Floating Button WA & Settings
- **Status:** **PROVED**. Kartu WA di `/contact` dihapus; floating button & key settings TETAP AKTIF.
- **Bukti Kode:**
  - `views/public/contact.ejs` hanya memiliki 2 kartu kantor fisik (Head Office Palmerah & Factory Cigondewah) serta embed Google Maps. Tidak ada kartu WhatsApp.
  - Floating button WA aktif di seluruh halaman via `views/partials/footer.ejs:170` yang menyertakan `views/partials/whatsapp-btn.ejs` dan skrip `public/js/whatsapp.js`.
  - Key pengaturan di tabel `settings`: `whatsapp_number`, `whatsapp_default_message`, `whatsapp_button_theme` tetap aktif dan dikelola via menu Pengaturan Situs CMS.

### 8. Struktur Folder Tech Spec 1.3 vs Struktur Repo Nyata
- **Status:** **DISCREPANCY TERBUKTI** (Banyak nama file & modul telah berevolusi).
- **Bukti Kode:**
  - **Controllers Admin:** Spek 1.3 mencatat `pageController.js`. Pada kenyataannya terbagi menjadi `aboutController.js`, `contactCmsController.js`, `homeContentController.js`, `pageHeroBannerController.js`, `capabilityController.js`, `authController.js`, `postCategoryController.js`, `productCategoryController.js`.
  - **Controllers Public:** Spek 1.3 mencatat `inquiryController.js` di public. Pada kenyataannya submit form kontak & RFQ ditangani langsung oleh `controllers/public/contactController.js`.
  - **Models:** Spek 1.3 mencatat `pageModel.js` dan `productVariantModel.js`. Pada kenyataannya `pageModel.js` tidak ada (digantikan `aboutModel.js`, `aboutGalleryModel.js`, `aboutStatsModel.js`, `aboutTimelineModel.js`), dan varian produk dikueri langsung di dalam `models/productModel.js`. Selain itu ada model aktif yang belum tercatat: `capabilityModel.js`, `homeContentModel.js`, `pageHeroBannerModel.js`, `slugRedirectModel.js`.
  - **Views:** Spek 1.3 belum merinci subfolder `views/admin/capabilities`, `views/admin/home-content`, `views/admin/hero-banners`, `views/admin/contact`.

### 9. Task About v1 "In Progress 12/14" (T-120, T-121) vs About v2/v3 Selesai
- **Status:** **SUPERSEDED**.
- **Bukti Kode:**
  - T-120 dan T-121 adalah task QA untuk About v1 (saat galeri masih berbentuk slider).
  - Ketika About v2 diimplementasikan (T-122 s/d T-132), gallery slider diganti total menjadi Bento Mosaic Grid. Kelompok QA About v2 (T-128: Verifikasi Mobile, T-129: Regresi CMS About, T-130: Regresi Menu Admin, T-132: Delivery Gate) telah selesai 100%.
  - Selanjutnya About v3 (T-133 s/d T-139) menyempurnakan isolasi CSS, engine Anime.js, dan QA penuh (T-139) selesai 100%.
  - T-120 dan T-121 sudah usang/tercakup oleh T-128, T-129, T-132, dan T-139.

---

## C. KONTEN NON-SPEC YANG AKAN DIARSIPKAN
Semua materi berikut bukan merupakan spesifikasi fungsional "kondisi aktif saat ini" dan akan dipindahkan ke `.agents/archive/`:

1. **RCA (Root Cause Analysis) Bug Historis:**
   - Tech Spec 6.1: *Analisis Akar Masalah & Solusi Bug Kritis Item 1 (Error CSRF 403 pada Form CRUD)*.
   - Tech Spec 7.1: *Analisis Investigasi & Akar Masalah Bug Interaktivitas UI (Item A: Konflik CDN & Script Execution)*.
   - Tech Spec 16.0 / Tasks T-182: *Analisis Akar Masalah URL Hero CTA Mengarah ke Kontak*.
2. **Audit Dampak Sekali Pakai:**
   - Tech Spec 8.7: *Audit Dampak Data Lokasi (Pembersihan Lokasi Operasional)*.
   - Tech Spec 13.3: *Audit Dependensi & Pembersihan Modul WhatsApp Kontak*.
   - Tech Spec 15.5: *Audit Ketergantungan Flag Unggulan (`is_featured` / `featured`)*.
3. **Komparasi Opsi Desain & Skema yang Ditolak:**
   - Tech Spec Revisi V6 B.1 Bagian 1: Komparasi Skema Database (Opsi A Kolom JSON vs Opsi B Tabel Terpisah vs Opsi C Key-Value).
   - Tech Spec Revisi V4 B.1 Bagian 3: Komparasi Layout Merek (Opsi I Grid Kartu vs Opsi II Logo Ribbon).
   - Tech Spec Revisi V5 B.1 Bagian 3 & 4: Komparasi Card Separation (Opsi 1A vs 2A) & Transisi Gradien.
   - Tech Spec Bagian 15 B.1: Komparasi 5 Opsi Arsitektur Homepage Major Update.
4. **Acceptance Criteria & Checklist Pengujian QA per Revisi:**
   - PRD 11.7: Acceptance Criteria PRD (CMS Konten Homepage v1).
   - PRD 12.8: Acceptance Criteria PRD (Revisi Tentang Kami & Gallery v1).
   - PRD 13.3: Acceptance Criteria PRD (Revisi Footer & Pengaturan Situs v1).
   - PRD 14.4: Acceptance Criteria PRD (Revisi Kontak & Footer v1).
   - PRD 15.5: Acceptance Criteria PRD (Homepage Major Update v1).
   - PRD 16.3: Acceptance Criteria PRD (Revisi Homepage: CTA Hero + Merek v1).
   - Tech Spec Revisi V6 C.2: Acceptance Criteria & Skenario Pengujian QA.
5. **Blok Prosedural & Transisional:**
   - Tech Spec lines 1866-1875: `## 🔄 Finalisasi & Alur Lanjutan`.
   - Ringkasan revisi changelog di awal/akhir dokumen spesifikasi.
6. **Narasi Panjang "Keputusan Terkunci":**
   - Narasi latar belakang perdebatan opsi dipadatkan menjadi tabel ringkas 1 baris per keputusan (`Keputusan | Alasan 1 Kalimat | Tanggal`) pada masing-masing modul terkait.

---

## D. RENCANA STRUKTUR AKHIR & ESTIMASI UKURAN

```
.agents/
├── INDEX.md                     # Peta dokumen & status modul (<=60 baris, ~2.5 KB)
├── WORKFLOW.md                  # Alur kerja perubahan spec/fitur (<=40 baris, ~2.0 KB)
├── CHANGELOG.md                 # 1 baris per perubahan selesai (tanggal | ringkas | T-xxx) (~3.0 KB)
├── 1-PRD.md                     # Entry: Visi, persona, arsitektur global, NFR, out-of-scope, tabel modul (~6.0 KB)
├── prd/                         # Spesifikasi Fungsional per Modul (maks ~8 KB per file)
│   ├── public-home.md           # Hero slider dual CTA, Intro, 4 Panel Kategori, WCU, Evidence, Marquee Brands (~7.5 KB)
│   ├── public-about.md          # Profil, Nilai, Visi Misi, Sejarah, Galeri Bento, Statistik (~6.5 KB)
│   ├── products.md              # Katalog, filter kategori, detail produk, varian, kapabilitas mesin, export CSV (~6.5 KB)
│   ├── news.md                  # Artikel, 3 tab kategori, headline slider, slug 301, TinyMCE (~5.5 KB)
│   ├── contact-footer.md        # Form RFQ .cf-*, dual office locations, footer, floating WA, pre-footer CTA (~6.5 KB)
│   ├── admin-cms.md             # Dashboard, RBAC, menu manajemen konten, inquiries/leads CRUD (~6.5 KB)
│   ├── media-library.md         # Upload, Sharp WebP, media picker modal, storage local/S3 (~5.0 KB)
│   ├── seo-security.md          # Meta tags, JSON-LD, sitemap, robots, CSRF, rate limiter, Turnstile (~5.5 KB)
│   └── settings.md              # Pengaturan situs, kontak, logo/favicon, medsos toggles (~5.0 KB)
├── 2-TECH-SPEC.md               # Entry: Tech stack, arsitektur global, standar database, tabel modul (~7.0 KB)
├── tech/                        # Spesifikasi Teknis per Modul (kondisi aktif saat ini, maks ~8 KB per file)
│   ├── public-home.md           # Skema banners/settings home_*, route, controller, komponen CSS .hcat-*, .wcu-*, .brand-strip-* (~7.5 KB)
│   ├── public-about.md          # Skema about_* tables & settings, route, engine Bento Anime.js, CSS .abt-gal-* (~7.5 KB)
│   ├── products.md              # Skema product_categories, products, product_variants, capabilities, CSV export (~7.0 KB)
│   ├── news.md                  # Skema posts, post_categories, slug_redirects, 301 logic, TinyMCE backend (~6.5 KB)
│   ├── contact-footer.md        # Skema inquiries & footer settings, route POST /contact, rateLimiter, CSS .cf-* (~6.5 KB)
│   ├── admin-cms.md             # Skema users, JWT session, middleware auth/role, inquiries status update (~6.5 KB)
│   ├── media-library.md         # Skema media, multer/Sharp pipeline, universal picker contract (~5.5 KB)
│   ├── seo-security.md          # Generator sitemap/robots, Helmet CSP, Turnstile verify, rate limiter rules (~6.0 KB)
│   └── settings.md              # Skema tabel settings, key registry, upload logo/favicon handler (~5.5 KB)
├── 3-TASKS.md                   # Hanya task OPEN + ringkasan total selesai (~3.5 KB)
├── changes/                     # Proposal perubahan berjalan (kosong saat inisialisasi)
└── archive/                     # Dokumen historis & pre-prune (tidak dibaca agent otomatis)
    ├── 2026-10-21_pre-prune/    # Salinan 4 file asli utuh
    ├── tasks-index-full.md      # Seluruh histori task T-01 s/d T-191
    └── non-spec-historical/     # RCA, audit sekali pakai, opsi ditolak, checklist regresi lama
```

### Estimasi Efisiensi Token
- **Sebelum Refaktor (Monolitik):** ~73.081 token (PRD + Tech Spec + Tasks + AGENTS).
- **Setelah Refaktor (Modular):**
  - Pembacaan dasar (INDEX.md + PRD Entry + Tech Spec Entry): ~15.5 KB (~3.875 token) &rarr; **Hemat 94,7%**.
  - Skenario Pengerjaan Fitur (INDEX + 1 Modul PRD + 1 Modul Tech): ~2.5 KB + 7.5 KB + 7.5 KB = ~17.5 KB (~4.375 token) &rarr; **Hemat 94,0%**.

---

## E. DAFTAR UNSURE & KONFLIK ANTAR DOKUMEN

Berikut adalah temuan inkonsistensi antara dokumen spek lama vs kode repo nyata:

1. **Konflik Modul Kapabilitas Mesin (`/capabilities`):**
   - *Kondisi:* Rute publik `/capabilities`, rute admin `/admin/capabilities`, controller `capabilityController.js`, model `capabilityModel.js`, view `views/public/capabilities.ejs`, dan tabel `capabilities` aktif di kode. Namun, di PRD hanya disebut satu baris pada daftar upload media (FR-19 item 8) dan tidak memiliki seksi functional requirement tersendiri.
   - *Status:* **UNSURE**. Apakah Kapabilitas Mesin dimasukkan ke dalam modul `products.md` (sebagai sub-fitur manufaktur) atau dibuat modul tersendiri?
2. **Konflik Tabel Legacy `categories` vs `product_categories`:**
   - *Kondisi:* Tabel `categories` masih ada di database MySQL tetapi tidak pernah di-query oleh kode aplikasi (`003_upgrade_v2_schema.sql` sudah menggantikannya dengan `product_categories`).
   - *Status:* **SUPERSEDED / DEPRECATED**. Dikonfirmasi `product_categories` adalah tabel aktif tunggal untuk kategori produk.
3. **Konflik Tabel Legacy `pages` vs `aboutModel`:**
   - *Kondisi:* Tabel `pages` ada di database (berisi 1 baris slug `about`), tetapi controller publik `pageController.about` dan controller admin `aboutController.js` sama sekali tidak membaca tabel `pages`. Seluruh konten Tentang Kami disimpan di tabel `settings` dan tabel relasional `about_gallery_slides`, `about_stats`, `about_timeline`.
   - *Status:* **SUPERSEDED / DEPRECATED**. Tabel `pages` tidak aktif di aplikasi.
4. **Konflik Dead Code `leadModel.js` & `leadController.js`:**
   - *Kondisi:* `leadModel.js` menjalankan kueri ke tabel `leads` yang tidak ada di MySQL, sehingga pemanggilan mirror di `contactController.js:235-248` menghasilkan log warning error. Rute admin `/admin/leads` sudah dialihkan ke `inquiryController.js` yang membaca tabel `inquiries`.
   - *Status:* **DEPRECATED**. Kontrak tabel dan data resmi adalah `inquiries` via `inquiryModel.js`.
5. **Konflik Toggle Default Section Sertifikasi Mutu Beranda (`.sec-evidence`):**
   - *Kondisi:* Fitur dan view `.sec-evidence` sudah selesai dan terpasang di `index.ejs:275-316`. Di database setting `home_cert_is_active = 0` secara default (bisa diaktifkan admin CMS). Pada pengujian QA T-191, tes sempat mengecek selector tanpa mengaktifkan setting ini di DB.
   - *Status:* **ACTIVE** secara fungsional sebagai section opsional berbasis toggle CMS.
6. **Task About v1 T-120 & T-121:**
   - *Kondisi:* Di `3-TASKS.md` berstatus `In Progress (12/14 Done)` karena T-120 dan T-121 belum dicentang, padahal About v2 dan v3 sudah selesai 100% dan terverifikasi.
   - *Status:* **SUPERSEDED** oleh task QA About v2/v3 (T-128, T-129, T-132, T-139).
7. **Rujukan Desain & Nilai Hex Warna:**
   - *Kondisi:* Nilai hex biru lama di spek bertentangan dengan rebrand hijau T-158..T-168 di `Design/DESIGN.md` dan `public/css/tokens.css`.
   - *Status:* **SUPERSEDED**.
